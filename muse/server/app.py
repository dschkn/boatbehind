#!/usr/bin/env python3
"""Muse single-user API. Python standard library only."""
import os, json, sqlite3, hashlib, hmac, secrets, time, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from http.cookies import SimpleCookie
from urllib.parse import urlsplit

HOST=os.getenv('MUSE_HOST','127.0.0.1')
PORT=int(os.getenv('MUSE_PORT','8765'))
DB=os.getenv('MUSE_DB','/var/lib/muse/board.sqlite3')
PASSWORD=os.environ.get('MUSE_PASSWORD')
SECRET=os.environ.get('MUSE_SESSION_SECRET')
if os.environ.get('MUSE_PASSWORD_FILE'):
    with open(os.environ['MUSE_PASSWORD_FILE'],encoding='utf-8') as password_file:
        PASSWORD=password_file.read().strip()
if os.environ.get('MUSE_SESSION_SECRET_FILE'):
    with open(os.environ['MUSE_SESSION_SECRET_FILE'],encoding='utf-8') as secret_file:
        SECRET=secret_file.read().strip()
if not PASSWORD or not SECRET or len(SECRET)<32:
    raise SystemExit('MUSE_PASSWORD and MUSE_SESSION_SECRET (32+ chars) required')
os.makedirs(os.path.dirname(DB),exist_ok=True)
lock=threading.Lock()
with sqlite3.connect(DB) as con:
    con.execute('CREATE TABLE IF NOT EXISTS board(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, body TEXT NOT NULL)')
    con.execute('INSERT OR IGNORE INTO board VALUES(1,0,?)',(json.dumps({'notes':[],'edges':[],'view':{'x':400,'y':250,'s':1}}),))
def sign(payload):
    return hmac.new(SECRET.encode(),payload.encode(),hashlib.sha256).hexdigest()
def session_ok(raw):
    try:
        payload,signature=raw.rsplit('.',1)
        timestamp=int(payload)
        return time.time()-timestamp<60*60*24*14 and timestamp<=time.time()+60 and hmac.compare_digest(sign(payload),signature)
    except (ValueError,TypeError):
        return False
attempts={}
class Handler(BaseHTTPRequestHandler):
    def json(self,code,body,cookie=None):
        b=json.dumps(body,ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(b)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if cookie:self.send_header('Set-Cookie',cookie)
        self.end_headers();self.wfile.write(b)
    def auth(self):
        cookie=SimpleCookie()
        try:cookie.load(self.headers.get('Cookie',''))
        except Exception:return False
        return session_ok(cookie['muse_session'].value) if 'muse_session' in cookie else False
    def origin_ok(self):
        origin=self.headers.get('Origin')
        return not origin or urlsplit(origin).hostname=='boatbehind.online' and urlsplit(origin).scheme=='https'
    def receive(self):
        size=int(self.headers.get('Content-Length','0'))
        if size<1 or size>2_000_000:raise ValueError('bad length')
        return json.loads(self.rfile.read(size))
    def do_GET(self):
        if self.path not in ('/muse-api/board','/board'):return self.json(404,{'error':'not_found'})
        if not self.auth():return self.json(401,{'error':'unauthorized'})
        with lock,sqlite3.connect(DB) as c:
            rev,body=c.execute('SELECT revision,body FROM board WHERE id=1').fetchone()
        self.json(200,{'revision':rev,'board':json.loads(body)})
    def do_POST(self):
        if not self.origin_ok():return self.json(403,{'error':'origin'})
        if self.path in ('/muse-api/logout','/logout'):
            return self.json(200,{'ok':True},'muse_session=; Path=/muse-api; HttpOnly; Secure; SameSite=Strict; Max-Age=0')
        if self.path not in ('/muse-api/login','/login'):return self.json(404,{'error':'not_found'})
        try:password=self.receive()['password']
        except (ValueError,KeyError,TypeError):return self.json(400,{'error':'invalid'})
        ip=self.client_address[0];now=time.monotonic()
        with lock:
            timestamps=[x for x in attempts.get(ip,[]) if now-x<900]
            if len(timestamps)>=10:return self.json(429,{'error':'rate_limit'})
            attempts[ip]=timestamps+[now]
        if not isinstance(password,str) or not hmac.compare_digest(password.encode(),PASSWORD.encode()):
            return self.json(401,{'error':'unauthorized'})
        with lock:attempts.pop(ip,None)
        payload=str(int(time.time()))
        self.json(200,{'ok':True},'muse_session='+payload+'.'+sign(payload)+'; Path=/muse-api; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600')
    def do_PUT(self):
        if not self.origin_ok():return self.json(403,{'error':'origin'})
        if self.path not in ('/muse-api/board','/board'):return self.json(404,{'error':'not_found'})
        if not self.auth():return self.json(401,{'error':'unauthorized'})
        try:
            payload=self.receive();board=payload['board'];rev=payload['revision']
            if not isinstance(board,dict) or not isinstance(board.get('notes'),list) or not isinstance(board.get('edges'),list) or not isinstance(rev,int):raise ValueError()
        except (ValueError,KeyError,TypeError):return self.json(400,{'error':'invalid'})
        with lock,sqlite3.connect(DB) as c:
            current=c.execute('SELECT revision FROM board WHERE id=1').fetchone()[0]
            if rev!=current:return self.json(409,{'error':'conflict','revision':current})
            rev+=1;c.execute('UPDATE board SET revision=?,body=? WHERE id=1',(rev,json.dumps(board,ensure_ascii=False)))
        self.json(200,{'revision':rev})
if __name__=='__main__':
    print(f'Muse API listening on {HOST}:{PORT}',flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
