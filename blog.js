document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.blog-like-button[data-post]');

  buttons.forEach((button) => {
    const postId = button.dataset.post;
    const baseCount = Number(button.dataset.base || 0);
    const storageKey = `boatbehind:blog-like:${postId}`;
    const countNode = button.querySelector('.like-count');
    const heartNode = button.querySelector('.heart');

    const render = () => {
      const liked = localStorage.getItem(storageKey) === '1';
      button.classList.toggle('is-liked', liked);
      button.setAttribute('aria-pressed', liked ? 'true' : 'false');
      if (countNode) countNode.textContent = String(baseCount + (liked ? 1 : 0));
      if (heartNode) heartNode.textContent = liked ? '♥' : '♡';
    };

    button.addEventListener('click', () => {
      const liked = localStorage.getItem(storageKey) === '1';
      if (liked) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, '1');
      }
      render();
    });

    render();
  });
});
