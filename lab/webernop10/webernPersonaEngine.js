/*
 * von Webern generator - Max classic JavaScript (ES5)
 * (c) Dmitrii Shchukin 2026
 *
 * One engine owns material, time, register, orchestration and score decoration.
 * The generated row is a twelve-tone material bank. In the op.10 profiles the
 * aggregate is exhausted before repetition, but the music is not presented as
 * a historical claim that op.10 uses Schoenbergian serial technique.
 *
 * Inlet 0 messages:
 *   seed <int> | eventcount <int> | profile <0..5> | tempo <bpm>
 *   density <0..1> | coherence <0..1> | metamorphosis <0..1>
 *   timbralcontrast <0..1> | symmetry <0..1> | silence <0..1>
 *   lyricism <0..1> | activity <x y ...> | dynamics <x y ...>
 *   generate | decorate | trace | clear
 *
 * Outlets:
 *   0 bach.roll commands
 *   1 generated row (pitch-name list)
 *   2 status
 *   3 bach.score commands (clear, dynamics, articulations)
 */

inlets = 1;
outlets = 4;

var DYNAMIC_MARKS = ["pppp", "ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"];
var PITCH_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
/*
 * low/high are conservative sounding limits; comfortLow/comfortHigh are the
 * statistically ordinary band used by the generator.  The outer band is not
 * forbidden, but is reserved for a structural focus or a strong activity peak.
 * Glockenspiel is intentionally kept much lower than its theoretical ceiling:
 * op.10 uses brilliance as colour, not a permanent ledger-line stunt.
 */
var INSTRUMENTS = [
    { name: "Flute", family: 0, monophonic: 1, low: 60, high: 93, comfortLow: 67, comfortHigh: 86 },
    { name: "Clarinet", family: 0, monophonic: 1, low: 50, high: 91, comfortLow: 55, comfortHigh: 82 },
    { name: "Trumpet", family: 1, monophonic: 1, low: 54, high: 82, comfortLow: 58, comfortHigh: 76 },
    { name: "Trombone", family: 1, monophonic: 1, low: 40, high: 67, comfortLow: 45, comfortHigh: 62 },
    { name: "Celesta", family: 2, monophonic: 0, low: 48, high: 96, comfortLow: 55, comfortHigh: 88 },
    { name: "Harp", family: 2, monophonic: 0, low: 36, high: 96, comfortLow: 43, comfortHigh: 88 },
    { name: "Glockenspiel", family: 2, monophonic: 1, low: 67, high: 91, comfortLow: 72, comfortHigh: 86 },
    { name: "Violin", family: 3, monophonic: 0, low: 55, high: 96, comfortLow: 60, comfortHigh: 88 },
    { name: "Viola", family: 3, monophonic: 0, low: 48, high: 82, comfortLow: 53, comfortHigh: 74 },
    { name: "Violoncello", family: 3, monophonic: 0, low: 36, high: 76, comfortLow: 43, comfortHigh: 67 }
];

var FAMILY_VOICES = [[1, 2], [3, 4], [5, 6, 7], [8, 9, 10]];
var MUTE_VOICES = [3, 4, 8, 9, 10];
var FLATTER_VOICES = [1, 2, 3];
var STRING_VOICES = [8, 9, 10];

/*
 * Group-level rhythmic cells.  A cell belongs to a micro-phrase rather than
 * to an instrument: this prevents the same neutral sixteenth-note pattern
 * from being stamped onto several unrelated voices.  Homorhythmic blocks are
 * the sole deliberate exception and remain short, score-level events.
 */
var RHYTHM_CELLS = {
    quiet: [
        [2, 0.75, 1.5], [1.5, 0.5, 2], [3, 0.75, 1],
        [2, 1 / 3, 2 / 3, 1.5], [1, 2, 0.75]
    ],
    medium: [
        [0.75, 0.5, 1], [1, 1 / 3, 2 / 3], [0.5, 1.5, 0.75],
        [2 / 3, 0.5, 1.25], [0.5, 0.75, 1 / 3, 1]
    ],
    active: [
        [0.25, 0.5, 1 / 3, 0.75], [1 / 3, 2 / 3, 0.25, 0.5],
        [0.5, 0.25, 0.75, 1 / 3], [0.25, 0.25, 2 / 3, 0.5, 1 / 3],
        [0.75, 1 / 3, 0.25, 2 / 3]
    ],
    slowfield: [
        [2, 0.75, 1.5], [1.5, 3, 1], [2.5, 0.5, 1],
        [1, 2.5, 0.75], [3, 0.5, 1.5]
    ]
};

/*
 * Score words are divided by function.  Tempo words are emitted as global
 * bach.score markers; expression words are sparse, local phrase directions;
 * playing techniques are emitted only when a playable state changes.
 * The vocabulary combines terms directly visible in op.10 with recurrent
 * Webern score language from opp. 5, 7, 9, 11, 21 and 27 and Stadlen's
 * performance score.  Writings-language (Zusammenhang, Fasslichkeit,
 * Gliederung) informs the decision model but is not printed as an instruction.
 */
var EXPRESSION_WORDS = {
    quiet: ["äußerst zart", "mit zartestem Ausdruck", "innig", "sehr innig", "wie ein Hauch", "kaum hörbar", "ganz leise", "verhalten", "schwebend", "verklingend"],
    lyrical: ["ausdrucksvoll", "mit Ausdruck", "espressivo", "sehr ausdrucksvoll", "dolce", "dolcissimo", "gesangvoll", "warm", "sehr gebunden", "zart hervortretend"],
    mobile: ["leicht", "flüchtig", "frei im Vortrag", "lebendig", "deutlich", "hervortretend", "etwas belebter", "mit neuer Kraft", "parlando", "zart bewegt"],
    forceful: ["kräftig", "sehr bestimmt", "scharf", "heftig bewegt", "markiert", "mit Nachdruck", "hervortretend", "sehr deutlich"]
};

/*
 * Research-informed affinities, not corpus probabilities. They encode
 * recurring functional links discussed by Kholopova/Kholopov and Zeller:
 * flute-celesta imitation, harp as a timbral medium, brass axes,
 * violin-glockenspiel augmentation, clarinet-viola background pairing.
 */
var TIMBRAL_AFFINITIES = {
    "1:3": 0.72, "1:5": 1.00, "1:6": 0.68, "1:8": 0.55,
    "2:5": 0.48, "2:9": 1.00, "2:10": 0.70,
    "3:4": 1.00, "3:5": 0.78, "3:6": 0.88,
    "4:6": 0.62, "4:10": 0.72,
    "5:6": 1.00, "5:7": 0.82, "5:8": 0.66, "5:9": 0.70,
    "6:7": 0.62, "6:8": 0.82, "6:9": 0.90, "6:10": 0.72,
    "7:8": 1.00,
    "8:9": 0.82, "8:10": 0.66,
    "9:10": 0.82
};

/*
 * Material-selection priorities derived from Hans Peter Reutter's analysis of
 * op. 10. They rank candidates; they do not replace the row shown by the UI,
 * the first aggregate, or any existing orchestration and notation pass.
 * Offsets in pitchCells are transposition-invariant pitch-class patterns.
 */
var REUTTER_MATERIAL = {
    "op10-synthesis": {
        toneGroupSizes: [2, 3, 3, 3, 4],
        pitchCells: [[0, 2, 1], [0, 10, 11], [0, 5, 4], [0, 7, 8]],
        centralPath: []
    },
    "op10-i": {
        openingPitchClass: 11,
        toneGroupSizes: [2, 3, 3, 3, 4],
        pitchCells: [[0, 2, 1], [0, 10, 11], [0, 5, 4], [0, 7, 8]],
        centralPath: [11, 8, 5],
        closurePitchClass: 5
    },
    "op10-ii": {
        openingPitchClass: 7,
        toneGroupSizes: [3, 4, 4, 5, 6],
        pitchCells: [[0, 2, 1, 5], [0, 10, 11, 6], [0, 5, 4, 9], [0, 7, 8, 3]],
        centralPath: [7, 8, 0, 4, 7]
    },
    "op10-iii": {
        openingPitchClass: 9,
        toneGroupSizes: [2, 3, 3, 4],
        pitchCells: [[0, 5, 9], [0, 7, 3], [0, 6, 11], [0, 5, 8, 2]],
        centralPath: [9, 2, 9],
        focalPitchClass: 9
    },
    "op10-iv": {
        openingPitchClass: 0,
        toneGroupSizes: [2, 3, 3, 3],
        pitchCells: [[0, 2, 1], [0, 10, 11], [0, 5, 4], [0, 7, 8]],
        centralPath: [9, 8],
        closurePitchClasses: [2, 3]
    },
    "op10-v": {
        openingPitchClass: 11,
        toneGroupSizes: [3, 3, 4, 4, 5],
        pitchCells: [[0, 7, 10], [0, 5, 2], [0, 3, 8], [0, 9, 4], [0, 2, 1]],
        centralPath: [11, 5, 9, 2, 8, 9],
        closurePitchClasses: [2, 3],
        epilogueStart: 0.56,
        epilogueVoices: [5, 6, 10]
    }
};

var FALLBACK_PROFILES = [
    { id: "op10-synthesis", baseTempo: 60, activity: [[0, 0.28], [0.42, 0.48], [0.7, 0.34], [1, 0.22]], dynamics: [[0, 0.18], [0.55, 0.46], [0.76, 0.34], [1, 0.2]], registerCurve: [[0, 0.34], [0.45, 0.64], [1, 0.32]], phraseSizes: [2, 3, 3, 4], focusPersistence: 0.68, homorhythmProbability: 0.14, pedalProbability: 0.08, registerRisk: 0.08, centralPath: [], formalAxis: 0.58, symmetryStrength: 0.58, axisVoices: [3, 4], initialMarking: "ruhig, zart", tempoPlan: [[0, 1, "ruhig"], [0.58, 0.9, "zögernd"], [0.72, 1, "a tempo"]], closure: "external" },
    { id: "op10-i", baseTempo: 50, activity: [[0, 0.2], [0.44, 0.48], [0.63, 0.42], [1, 0.12]], dynamics: [[0, 0.08], [0.5, 0.25], [1, 0.1]], registerCurve: [[0, 0.36], [0.5, 0.7], [1, 0.34]], phraseSizes: [2, 3, 3, 4], focusPersistence: 0.74, homorhythmProbability: 0.1, pedalProbability: 0.05, registerRisk: 0.05, centralPath: [11, 8, 5], openingVoices: [1, 6, 9], formalAxis: 0.5, symmetryStrength: 0.95, axisVoices: [3, 4], focalPitchClass: 8, focalVoices: [5], initialMarking: "Sehr ruhig und zart", tempoPlan: [[0, 1, "Sehr ruhig"], [0.46, 0.84, "zögernd"], [0.58, 1, "a tempo"]], closurePitchClass: 5, closure: "timbral-palindrome-and-tritone" },
    { id: "op10-ii", baseTempo: 100, activity: [[0, 0.46], [0.35, 0.58], [0.72, 0.7], [1, 0.94]], dynamics: [[0, 0.18], [0.5, 0.46], [0.82, 0.78], [1, 1]], registerCurve: [[0, 0.36], [0.36, 0.55], [0.72, 0.66], [1, 0.82]], phraseSizes: [3, 4, 5, 6], focusPersistence: 0.78, homorhythmProbability: 0.3, pedalProbability: 0.06, registerRisk: 0.2, centralPath: [], formalAxis: 0.58, symmetryStrength: 0.42, axisVoices: [3, 4], initialMarking: "Lebhaft und zart bewegt · drängend", tempoPlan: [[0, 1, "drängend"], [0.25, 0.9, "poco rit."], [0.38, 1, "a tempo"], [0.62, 0.86, "zögernd"], [0.72, 1, "a tempo"], [0.84, 1.44, "rasch"]], closure: "rhythmic-clarification" },
    { id: "op10-iii", baseTempo: 40, activity: [[0, 0.12], [0.48, 0.2], [0.72, 0.3], [1, 0.12]], dynamics: [[0, 0.06], [0.58, 0.3], [0.78, 0.42], [1, 0.1]], registerCurve: [[0, 0.58], [0.55, 0.74], [1, 0.56]], phraseSizes: [2, 3, 3, 4], focusPersistence: 0.72, homorhythmProbability: 0.14, pedalProbability: 0.42, pedalVoices: [5, 6, 7, 8, 9, 10], registerRisk: 0.04, centralPath: [4], formalAxis: 0.55, symmetryStrength: 0.66, focalPitchClass: 4, focalVoices: [5, 6, 7], initialMarking: "Sehr langsam und äußerst ruhig", tempoPlan: [[0, 1, "äußerst ruhig"], [0.68, 0.9, "zögernd"], [0.82, 1, "a tempo"]], closure: "high-resonant-focal-field" },
    { id: "op10-iv", baseTempo: 60, activity: [[0, 0.32], [0.46, 0.48], [0.72, 0.28], [1, 0.12]], dynamics: [[0, 0.1], [0.52, 0.3], [1, 0.08]], registerCurve: [[0, 0.46], [0.5, 0.34], [1, 0.7]], phraseSizes: [3, 3, 3, 2], focusPersistence: 0.82, homorhythmProbability: 0.18, pedalProbability: 0.08, registerRisk: 0.06, centralPath: [9, 10], formalAxis: 0.62, symmetryStrength: 0.86, silenceAxes: [0.62], focalPitchClass: 9, focalVoices: [2, 9], gestureContour: [1, 1, -1], responseContour: [-1, -1, 1], initialMarking: "Fließend, äußerst zart", tempoPlan: [[0, 1, "Fließend"], [0.48, 0.82, "Zeit lassen"], [0.62, 1, "a tempo"]], closure: "gesture-inversion-and-return-of-colour" },
    { id: "op10-v", baseTempo: 152, activity: [[0, 0.62], [0.48, 0.8], [0.62, 1], [0.76, 0.3], [1, 0.08]], dynamics: [[0, 0.34], [0.5, 0.72], [0.62, 1], [0.8, 0.16], [1, 0.04]], registerCurve: [[0, 0.46], [0.58, 0.86], [0.76, 0.38], [1, 0.22]], phraseSizes: [3, 4, 5, 6], focusPersistence: 0.76, homorhythmProbability: 0.4, pedalProbability: 0.16, registerRisk: 0.2, centralPath: [], formalAxis: 0.58, symmetryStrength: 0.48, initialMarking: "Sehr fließend", tempoPlan: [[0, 1, "Sehr fließend"], [0.32, 1.08, "drängend"], [0.5, 0.92, "poco rit."], [0.62, 1, "a tempo"], [0.76, 0.74, "ruhig"], [0.86, 0.86, "etwas drängend"], [0.94, 0.68, "molto rit."]], closurePitchClasses: [2, 3], closure: "reminiscence-and-epilogue" }
];

var profiles = FALLBACK_PROFILES;
var config = {
    seed: 1913,
    eventCount: 25,
    profileIndex: 0,
    tempo: 60,
    density: 0.45,
    coherence: 0.78,
    metamorphosis: 0.62,
    timbralContrast: 0.72,
    symmetry: 0.68,
    silence: 0.55,
    lyricism: 0.8,
    activityPoints: [[0, 0.24], [0.42, 0.52], [0.72, 0.38], [1, 0.2]],
    dynamicPoints: [[0, 0.16], [0.58, 0.54], [0.78, 0.36], [1, 0.18]]
};

var rngState = 1913;
var currentRow = [];
var generatedEvents = [];
var generationCounter = 0;

function loadbang() {
    loadProfiles();
    status("ready", "profile", activeProfile().id);
}

function seed(value) {
    config.seed = normalizeSeed(value);
    generationCounter = 0;
}

function eventcount(value) {
    config.eventCount = clamp(Math.floor(Number(value)), 1, 240);
}

function profile(value) {
    config.profileIndex = clamp(Math.floor(Number(value)), 0, profiles.length - 1);
    status("profile", activeProfile().id);
}

function tempo(value) {
    config.tempo = clamp(Number(value), 24, 180);
}

function density(value) {
    config.density = clamp(Number(value), 0, 1);
}

function coherence(value) {
    config.coherence = clamp(Number(value), 0, 1);
}

function metamorphosis(value) {
    config.metamorphosis = clamp(Number(value), 0, 1);
}

function timbralcontrast(value) {
    config.timbralContrast = clamp(Number(value), 0, 1);
}

function symmetry(value) {
    config.symmetry = clamp(Number(value), 0, 1);
}

function silence(value) {
    config.silence = clamp(Number(value), 0, 1);
}

function lyricism(value) {
    config.lyricism = clamp(Number(value), 0, 1);
}

function activity() {
    config.activityPoints = parsePoints(arrayfromargs(arguments), config.activityPoints);
}

function dynamics() {
    config.dynamicPoints = parsePoints(arrayfromargs(arguments), config.dynamicPoints);
}

function bang() {
    generate();
}

function clear() {
    currentRow = [];
    generatedEvents = [];
    outlet(0, ["clear"]);
    outlet(3, ["clear"]);
    outlet(1, ["-"]);
    status("cleared");
}

function reloadprofiles() {
    loadProfiles();
    status("profiles", "reloaded", profiles.length);
}

function generate() {
    var actualSeed = normalizeSeed(config.seed + generationCounter * 7919 + config.profileIndex * 101);
    seedRandom(actualSeed);
    generationCounter++;
    currentRow = normalizeRowForProfile(chooseRow(), activeProfile());
    generatedEvents = buildEvents(currentRow, activeProfile());

    outlet(0, ["clear"]);
    outlet(3, ["clear"]);

    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        outlet(0, [
            "addchord", event.voice, "[", round3(event.onsetMs),
            "[", event.pitchCents, round3(event.durationMs), event.velocity, "]", "]"
        ]);
    }

    var names = [];
    for (var rowIndex = 0; rowIndex < currentRow.length; rowIndex++) {
        names.push(PITCH_NAMES[currentRow[rowIndex]]);
    }
    outlet(1, names);
    status("generated", generatedEvents.length, "events", "seed", actualSeed, "generation", generationCounter, "profile", activeProfile().id);
}

function trace() {
    if (generatedEvents.length === 0) {
        status("error", "generate_material_first");
        return;
    }
    post("--- von Webern decision trace ---\n");
    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        post(
            (i + 1) + ". " + INSTRUMENTS[event.voice - 1].name +
            " | role=" + event.role +
            " | group=" + (event.groupIndex + 1) +
            " | " + event.decisionReason + "\n"
        );
    }
    status("trace_written_to_max_console", generatedEvents.length, "events");
}

function decorate() {
    if (generatedEvents.length === 0) {
        status("error", "generate_material_first");
        return;
    }

    var dynamicCount = emitDynamics();
    var articulationCount = emitArticulations();
    var annotationCount = emitAnnotations();
    var phraseCount = emitPhraseMetadata();
    var tempoCount = emitGlobalDirections();
    var meterCount = emitMeterChanges();
    outlet(3, ["unsel", "all"]);
    status("score_ready", "dynamics", dynamicCount, "articulations", articulationCount,
        "annotations", annotationCount, "phrases", phraseCount, "tempi", tempoCount, "meters", meterCount);
}

function buildEvents(row, profileData) {
    var result = [];
    var beatMs = 60000 / config.tempo;
    var onsetBeats = 0;
    var previousVoice = 0;
    var recentVoices = [];
    var groupIndex = -1;
    var groupPosition = 0;
    var groupSize = 0;
    var groupPlan = null;
    var markingState = { techniques: {}, flags: {}, expressionGroups: {}, usedWords: {} };
    var sectionPlans = buildSectionPlans(profileData);
    var recentRhythmSignatures = [];

    for (var i = 0; i < config.eventCount; i++) {
        var t = config.eventCount === 1 ? 0 : i / (config.eventCount - 1);
        if (groupPosition >= groupSize) {
            groupIndex++;
            groupSize = Math.min(chooseGroupSize(profileData, t), config.eventCount - i);
            groupPosition = 0;
            groupPlan = chooseGroupPlan(
                profileData, t, groupIndex, groupSize, previousVoice,
                recentVoices, i, onsetBeats, recentRhythmSignatures
            );
            if (groupPlan.texture === "pedal-tremolo") {
                groupSize = Math.min(groupSize, 3);
            }
            recentRhythmSignatures.push(groupPlan.rhythmSignature);
            if (recentRhythmSignatures.length > 3) { recentRhythmSignatures.shift(); }
            groupPlan.sectionStyle = sectionPlans[Math.min(sectionPlans.length - 1,
                Math.floor(t * sectionPlans.length))];
        }
        var groupInfo = {
            index: groupIndex,
            position: groupPosition,
            size: groupSize,
            leader: groupPlan.leader,
            texture: groupPlan.texture,
            synchronized: groupPlan.synchronized
        };
        var mirrorEvent = mirroredPartner(result, i, profileData);
        var activityValue = combinedCurve(t, config.activityPoints, profileData.activity, 0.78);
        // The Dynamics function is the global dramaturgy itself: its full
        // vertical span maps directly from pppp to fff.  Movement selection
        // installs a characteristic default curve in the UI; user edits then
        // remain authoritative instead of being silently profile-limited.
        var dynamicValue = interpolate(config.dynamicPoints, t);
        var material = materialForProfile(profileData);
        var pitchClass = (i >= 12 && groupPlan.texture === "pedal-tremolo" && material.focalPitchClass !== undefined) ?
            material.focalPitchClass : pitchClassForEvent(row, profileData, i, t, groupPlan, groupInfo);
        var role = formalRole(profileData, t, groupInfo, pitchClass);
        var breathPhase = (groupPosition + 1) / (groupSize + 1);
        if (dynamicValue > 0.08 && dynamicValue < 0.92) {
            var phraseBreath = (Math.sin(Math.PI * breathPhase) - 0.55) * 0.1 * config.lyricism;
            dynamicValue = clamp(dynamicValue + phraseBreath, 0, 1);
        }
        var durationBeats = chooseDurationBeats(activityValue, profileData, t, groupInfo, mirrorEvent, groupPlan);
        if (groupPlan.synchronized && groupPlan.sharedDuration === null) {
            groupPlan.sharedDuration = durationBeats;
        }
        if (groupPlan.synchronized) {
            durationBeats = groupPlan.sharedDuration;
        }
        var voiceDecision = chooseGroupVoice(
            groupPlan, groupInfo, previousVoice, recentVoices,
            profileData, t, i, role, mirrorEvent
        );
        var voice = voiceDecision.voice;
        var previousVoiceEvent = lastEventForVoice(result, voice);
        var midiNote = placeInRegister(
            pitchClass, voice, t, activityValue, i,
            previousVoiceEvent, groupInfo, mirrorEvent, profileData
        );
        var dynamicLevel = dynamicLevelForValue(dynamicValue, [0, DYNAMIC_MARKS.length - 1]);
        var articulation = chooseArticulation(
            voice, durationBeats, activityValue, t, profileData, groupPlan
        );
        var annotation = chooseAnnotation(
            profileData, t, groupPlan, groupInfo, voice,
            activityValue, articulation, markingState
        );

        var builtEvent = {
            index: i,
            voice: voice,
            onsetBeats: onsetBeats,
            onsetMs: onsetBeats * beatMs,
            durationBeats: durationBeats,
            durationMs: durationBeats * beatMs,
            pitchClass: pitchClass,
            pitchCents: midiNote * 100,
            velocity: dynamicToVelocity(dynamicLevel),
            dynamicLevel: dynamicLevel,
            articulation: articulation,
            annotation: annotation,
            role: role,
            groupIndex: groupIndex,
            groupPosition: groupPosition,
            groupSize: groupSize,
            groupTexture: groupPlan.texture,
            rhythmSignature: groupPlan.rhythmSignature,
            materialCell: groupPlan.materialCell ? groupPlan.materialCell.join(":") : "",
            phraseFocus: groupPlan.focusVoice,
            sectionIndex: groupPlan.sectionStyle.index,
            technique: groupPlan.sectionStyle.techniques[voice],
            articulationMode: groupPlan.sectionStyle.articulations[INSTRUMENTS[voice - 1].family],
            synchronized: groupPlan.synchronized,
            mirrorOf: mirrorEvent ? mirrorEvent.index : -1,
            decisionReason: groupPlan.texture + "; " + voiceDecision.reason
        };
        result.push(builtEvent);
        if (groupPosition === 0) {
            groupPlan.leader = builtEvent;
        }
        groupPlan.usedVoices.push(voice);

        if (groupPlan.synchronized) {
            if (groupPosition === groupSize - 1) {
                onsetBeats = groupPlan.startBeats + Math.max(0.5, durationBeats * 0.72) +
                    groupBreath(profileData, activityValue, t);
            }
        } else {
            onsetBeats += chooseInterOnsetBeats(
                durationBeats, activityValue, profileData, t, groupInfo, groupPlan
            );
        }
        previousVoice = voice;
        recentVoices.push(voice);
        if (recentVoices.length > 6) {
            recentVoices.shift();
        }
        groupPosition++;
    }

    applyClosures(result, profileData);
    capPedalConcurrency(result, beatMs);
    enforceMonophonicOnsets(result);
    enforceMonophonicLines(result, beatMs);
    sanitizeTechniqueGrammar(result);
    applyPhrasePlans(result);
    return result;
}

function buildSectionPlans(profileData) {
    var sectionCount = (profileData.id === "op10-ii" || profileData.id === "op10-v") ? 5 :
        (profileData.id === "op10-iii" ? 3 : 4);
    var plans = [];
    var muteStart = Math.floor(random01() * Math.max(1, sectionCount - 1));
    var flatterSection = 1 + Math.floor(random01() * Math.max(1, sectionCount - 2));
    var pizzSection = 1 + Math.floor(random01() * Math.max(1, sectionCount - 2));

    for (var section = 0; section < sectionCount; section++) {
        var t = (section + 0.5) / sectionCount;
        var activityValue = interpolate(profileData.activity, t);
        var articulations = [];
        articulations[0] = activityValue > 0.68 ? "detached" : (section % 2 ? "portato" : "legato");
        articulations[1] = activityValue > 0.58 ? "accented" : "sustained";
        articulations[2] = profileData.id === "op10-iii" ? "resonant" : (activityValue > 0.66 ? "punctuated" : "resonant");
        articulations[3] = activityValue > 0.7 ? "accented" : (section % 3 === 1 ? "portato" : "legato");

        var techniques = {};
        for (var voice = 1; voice <= 10; voice++) {
            techniques[voice] = voice >= 8 ? "arco" : "ordinary";
        }

        if ((profileData.id === "op10-i" || profileData.id === "op10-iv") &&
                section >= muteStart && section <= muteStart + 1) {
            for (var muteIndex = 0; muteIndex < MUTE_VOICES.length; muteIndex++) {
                techniques[MUTE_VOICES[muteIndex]] = "muted";
            }
        }
        if (profileData.id === "op10-ii" && section === Math.max(2, sectionCount - 2)) {
            techniques[8] = techniques[9] = techniques[10] = "col-legno";
        }
        if ((profileData.id === "op10-v" || profileData.id === "op10-synthesis") && section === pizzSection) {
            techniques[8] = techniques[9] = techniques[10] = "pizzicato";
        }
        if ((profileData.id === "op10-ii" || profileData.id === "op10-v") && section === flatterSection) {
            var flatterCandidates = profileData.id === "op10-v" ? [1, 2, 3] : [1, 3];
            var flatterVoice = flatterCandidates[Math.floor(random01() * flatterCandidates.length)];
            techniques[flatterVoice] = "flatter";
        }
        if (profileData.id === "op10-iii") {
            techniques[7] = "soft-mallet";
            articulations[2] = "resonant";
        }

        plans.push({
            index: section,
            articulations: articulations,
            techniques: techniques
        });
    }
    return plans;
}

function chooseGroupSize(profileData, t) {
    var material = materialForProfile(profileData);
    var options = material.toneGroupSizes || profileData.phraseSizes || [2, 3, 3, 4];
    if (profileData.id === "op10-v" && t > 0.8) {
        options = [1, 2, 2, 3];
    } else if (profileData.id === "op10-ii" && t > 0.72) {
        options = [4, 5, 6, 6];
    }
    return options[Math.floor(random01() * options.length)];
}

function chooseGroupPlan(profileData, t, groupIndex, groupSize, previousVoice, recentVoices, eventIndex, onsetBeats, recentRhythmSignatures) {
    var pedalChance = profileData.pedalProbability || 0;
    var syncChance = profileData.homorhythmProbability || 0;
    if (profileData.id === "op10-ii" && t > 0.65) {
        syncChance += 0.32;
    }
    if (profileData.id === "op10-v" && t > 0.38 && t < 0.72) {
        syncChance += 0.28;
    }
    if (profileData.id === "op10-i" && t > 0.38 && t < 0.62) {
        syncChance += 0.08;
    }

    var texture = "solo-line";
    if (profileData.id === "op10-iii" && eventIndex >= 12 && random01() < pedalChance) {
        texture = "pedal-tremolo";
    } else if (random01() < syncChance) {
        texture = "homorhythm";
    } else if (profileData.id === "op10-iv") {
        texture = groupIndex % 2 === 0 ? "solo-line" : "echo";
    } else if (groupIndex % 3 === 1) {
        texture = "exchange";
    } else if (groupIndex % 4 === 3) {
        texture = "echo";
    }

    var focusDecision = chooseVoice(
        previousVoice, recentVoices, profileData, t, eventIndex,
        texture === "pedal-tremolo" ? "pedal" : "foreground", null
    );
    if (profileData.openingVoices && eventIndex < profileData.openingVoices.length) {
        focusDecision.voice = profileData.openingVoices[eventIndex];
        focusDecision.reason = "documented opening colour plan";
    }
    if (texture === "pedal-tremolo" && profileData.pedalVoices) {
        focusDecision.voice = profileData.pedalVoices[Math.floor(random01() * profileData.pedalVoices.length)];
        focusDecision.reason = "movement III resonant pedal carrier";
    }

    var rhythmCell = chooseRhythmCell(profileData, t, recentRhythmSignatures || []);
    return {
        index: groupIndex,
        texture: texture,
        synchronized: texture === "homorhythm",
        focusVoice: focusDecision.voice,
        focusReason: focusDecision.reason,
        echoVoice: 0,
        startBeats: onsetBeats,
        sharedDuration: null,
        rhythmCell: rhythmCell,
        rhythmSignature: rhythmSignature(rhythmCell),
        leader: null,
        usedVoices: []
    };
}

function chooseGroupVoice(groupPlan, groupInfo, previousVoice, recentVoices, profileData, t, eventIndex, role, mirrorEvent) {
    if (profileData.openingVoices && eventIndex < profileData.openingVoices.length) {
        return { voice: profileData.openingVoices[eventIndex], reason: "documented opening colour plan" };
    }
    if (groupInfo.position === 0) {
        return { voice: groupPlan.focusVoice, reason: "temporary phrase focus; " + groupPlan.focusReason };
    }

    if (groupPlan.texture === "pedal-tremolo") {
        var pedalVoices = profileData.pedalVoices || [5, 6, 7];
        var availablePedals = withoutUsedVoices(pedalVoices, groupPlan.usedVoices);
        if (availablePedals.length === 0) {
            availablePedals = withoutUsedVoices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], groupPlan.usedVoices);
        }
        return {
            voice: availablePedals[Math.floor(random01() * availablePedals.length)],
            reason: "combined tremolo pedal field"
        };
    }

    if (groupPlan.texture === "homorhythm") {
        var family = INSTRUMENTS[groupPlan.focusVoice - 1].family;
        var sameFamilyAvailable = withoutUsedVoices(FAMILY_VOICES[family], groupPlan.usedVoices);
        var syncDecision;
        if (sameFamilyAvailable.length > 0 && groupInfo.position < 3 && random01() < 0.72) {
            syncDecision = {
                voice: sameFamilyAvailable[Math.floor(random01() * sameFamilyAvailable.length)],
                reason: "brief instrumental-family block"
            };
        } else {
            syncDecision = chooseVoice(previousVoice, recentVoices, profileData, t, eventIndex, role, mirrorEvent);
        }
        var guard = 0;
        while (groupPlan.usedVoices.indexOf(syncDecision.voice) >= 0 && guard < 16) {
            syncDecision = chooseVoice(previousVoice, recentVoices, profileData, t, eventIndex + guard + 1, role, mirrorEvent);
            guard++;
        }
        if (groupPlan.usedVoices.indexOf(syncDecision.voice) >= 0) {
            var unused = withoutUsedVoices([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], groupPlan.usedVoices);
            syncDecision.voice = unused.length ? unused[Math.floor(random01() * unused.length)] : syncDecision.voice;
            syncDecision.reason = "playability guard for shared attack";
        }
        syncDecision.reason = "shared rhythmic block; " + syncDecision.reason;
        return syncDecision;
    }

    var persistence = profileData.focusPersistence === undefined ? 0.7 : profileData.focusPersistence;
    persistence = clamp(persistence + config.coherence * 0.16 - config.timbralContrast * 0.08, 0.35, 0.94);
    if (groupPlan.texture === "solo-line" && random01() < persistence) {
        return { voice: groupPlan.focusVoice, reason: "micro-phrase keeps the foreground instrument" };
    }
    if (groupPlan.texture === "exchange") {
        if (groupInfo.position < Math.ceil(groupInfo.size * 0.55)) {
            return { voice: groupPlan.focusVoice, reason: "foreground instrument sustains its short phrase" };
        }
        if (!groupPlan.echoVoice) {
            groupPlan.echoVoice = chooseAffinedVoice(groupPlan.focusVoice, profileData, groupPlan.usedVoices);
        }
        return { voice: groupPlan.echoVoice, reason: "micro-motive handed to an affined colour" };
    }
    if (groupPlan.texture === "echo") {
        if (!groupPlan.echoVoice) {
            groupPlan.echoVoice = chooseAffinedVoice(groupPlan.focusVoice, profileData, groupPlan.usedVoices);
        }
        return {
            voice: groupInfo.position % 2 === 0 ? groupPlan.focusVoice : groupPlan.echoVoice,
            reason: "call-and-response inside the phrase"
        };
    }
    return chooseVoice(previousVoice, recentVoices, profileData, t, eventIndex, role, mirrorEvent);
}

function chooseAffinedVoice(sourceVoice, profileData, usedVoices) {
    var weights = [];
    for (var voice = 1; voice <= INSTRUMENTS.length; voice++) {
        var weight = 0.15 + timbralAffinity(sourceVoice, voice) * 2.2;
        if (voice === sourceVoice) {
            weight = 0.02;
        }
        if (INSTRUMENTS[voice - 1].family === INSTRUMENTS[sourceVoice - 1].family) {
            weight += 1.25 + config.coherence * 1.25;
        }
        if (usedVoices.indexOf(voice) >= 0) {
            weight *= 0.3;
        }
        if (profileData.voiceWeights && profileData.voiceWeights.length === 10) {
            weight *= profileData.voiceWeights[voice - 1];
        }
        weights.push(weight);
    }
    return weightedIndex(weights) + 1;
}

function withoutUsedVoices(voices, usedVoices) {
    var result = [];
    for (var i = 0; i < voices.length; i++) {
        if (usedVoices.indexOf(voices[i]) < 0) {
            result.push(voices[i]);
        }
    }
    return result;
}

function lastEventForVoice(events, voice) {
    for (var i = events.length - 1; i >= 0; i--) {
        if (events[i].voice === voice) {
            return events[i];
        }
    }
    return null;
}

function groupBreath(profileData, activityValue, t) {
    var breath = (0.18 + config.silence * 0.8) * (1.15 - activityValue * 0.55);
    if (profileData.id === "op10-iii" || profileData.id === "op10-iv") {
        breath *= 1.35;
    }
    if (profileData.id === "op10-ii" && t > 0.72) {
        breath *= 0.45;
    }
    return nearestValue(breath, [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5]);
}

function mirroredPartner(events, eventIndex, profileData) {
    if (!profileData.formalAxis || events.length === 0) {
        return null;
    }
    var axisIndex = Math.round((config.eventCount - 1) * profileData.formalAxis);
    if (eventIndex <= axisIndex) {
        return null;
    }
    var mirrorIndex = axisIndex - (eventIndex - axisIndex);
    if (mirrorIndex < 0 || mirrorIndex >= events.length) {
        return null;
    }
    var strength = profileData.symmetryStrength === undefined ? 0.7 : profileData.symmetryStrength;
    return random01() < config.symmetry * strength ? events[mirrorIndex] : null;
}

function formalRole(profileData, t, groupInfo, pitchClass) {
    var axis = profileData.formalAxis === undefined ? 0.58 : profileData.formalAxis;
    if (Math.abs(t - axis) < 0.045) {
        return "axis";
    }
    var material = materialForProfile(profileData);
    if (material.focalPitchClass !== undefined && pitchClass === material.focalPitchClass) {
        return "pedal";
    }
    if (groupInfo.position === 0) {
        return "foreground";
    }
    if (groupInfo.position === groupInfo.size - 1) {
        return "echo";
    }
    return "background";
}

function chooseRow() {
    var best = null;
    var bestScore = -999999;

    for (var attempt = 0; attempt < 128; attempt++) {
        var candidate = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        var candidateScore = scoreRow(candidate, activeProfile());
        if (candidateScore > bestScore) {
            best = candidate;
            bestScore = candidateScore;
        }
    }
    return best;
}

function scoreRow(row, profileData) {
    var intervalClasses = {};
    var score = 0;
    var previousInterval = -1;
    var repeatedIntervalRun = 0;

    for (var i = 1; i < row.length; i++) {
        var directed = mod(row[i] - row[i - 1], 12);
        var intervalClass = Math.min(directed, 12 - directed);
        intervalClasses[intervalClass] = 1;

        if (intervalClass === previousInterval) {
            repeatedIntervalRun++;
            score -= repeatedIntervalRun * 1.5;
        } else {
            repeatedIntervalRun = 0;
        }
        if (intervalClass === 1 || intervalClass === 2 || intervalClass === 6) {
            score += 1.2;
        }
        previousInterval = intervalClass;
    }

    var diversity = 0;
    for (var key in intervalClasses) {
        if (intervalClasses.hasOwnProperty(key)) {
            diversity++;
        }
    }
    score += diversity * 3;

    for (var groupStart = 0; groupStart < 12; groupStart += 3) {
        var a = row[groupStart];
        var b = row[groupStart + 1];
        var c = row[groupStart + 2];
        var first = shortestDistance(a, b);
        var second = shortestDistance(b, c);
        if ((first <= 2 && second >= 3) || (second <= 2 && first >= 3)) {
            score += 2.5;
        }
        score += materialCellScore(row, groupStart, materialForProfile(profileData).pitchCells || []);
    }
    return score;
}

function materialCellScore(row, start, cells) {
    if (!cells || cells.length === 0 || start + 2 >= row.length) { return 0; }
    var bestCost = 99;
    for (var cellIndex = 0; cellIndex < cells.length; cellIndex++) {
        var cell = cells[cellIndex];
        var limit = Math.min(3, cell.length, row.length - start);
        var cost = 0;
        for (var position = 1; position < limit; position++) {
            var actual = mod(row[start + position] - row[start], 12);
            cost += shortestDistance(actual, mod(cell[position], 12));
        }
        bestCost = Math.min(bestCost, cost);
    }
    return Math.max(0, 8 - bestCost * 1.75);
}

function pitchClassForEvent(row, profileData, eventIndex, t, groupPlan, groupInfo) {
    /* The displayed row is literally the first aggregate heard in the score. */
    if (eventIndex < 12) {
        return row[eventIndex];
    }
    var cycle = Math.floor(eventIndex / 12);
    var formIndex = mod(cycle + config.profileIndex, 4);
    var form = rowForm(row, formIndex);
    var localIndex = mod(eventIndex, 12);
    var transposition = 0;

    var material = materialForProfile(profileData);
    var centralPath = material.centralPath || [];
    if (centralPath.length > 0) {
        var centralIndex = Math.min(centralPath.length - 1, Math.floor(t * centralPath.length));
        var target = centralPath[centralIndex];
        transposition = mod(target - form[0], 12);
    } else {
        transposition = mod(cycle * 5, 12);
    }
    var basePitchClass = mod(form[localIndex] + transposition, 12);
    var cells = material.pitchCells || [];
    if (groupPlan && groupInfo && cells.length > 0) {
        if (!groupPlan.materialCell) {
            groupPlan.materialCell = cells[Math.floor(random01() * cells.length)].slice(0);
            groupPlan.materialCellStart = groupInfo.position;
            groupPlan.materialAnchor = basePitchClass;
        }
        var relativePosition = groupInfo.position - groupPlan.materialCellStart;
        if (relativePosition >= 0 && relativePosition < groupPlan.materialCell.length) {
            return mod(groupPlan.materialAnchor + groupPlan.materialCell[relativePosition], 12);
        }
    }
    return basePitchClass;
}

function normalizeRowForProfile(row, profileData) {
    var openingPitchClass = materialForProfile(profileData).openingPitchClass;
    if (openingPitchClass === undefined) {
        return row;
    }
    var transposition = mod(openingPitchClass - row[0], 12);
    var normalized = [];
    for (var i = 0; i < row.length; i++) {
        normalized.push(mod(row[i] + transposition, 12));
    }
    return normalized;
}

function chooseRhythmCell(profileData, t, recentSignatures) {
    var activityValue = interpolate(profileData.activity, t);
    var category = profileData.id === "op10-iii" ? "slowfield" :
        (activityValue < 0.26 ? "quiet" : (activityValue > 0.68 ? "active" : "medium"));
    var pool = RHYTHM_CELLS[category];
    var candidates = [];
    for (var i = 0; i < pool.length; i++) {
        if (recentSignatures.indexOf(rhythmSignature(pool[i])) < 0) {
            candidates.push(pool[i]);
        }
    }
    if (candidates.length === 0) { candidates = pool; }
    return candidates[Math.floor(random01() * candidates.length)].slice(0);
}

function rhythmSignature(cell) {
    var tokens = [];
    for (var i = 0; i < cell.length; i++) { tokens.push(round3(cell[i])); }
    return tokens.join(":");
}

function rowForm(row, formIndex) {
    var result = [];
    var i;
    if (formIndex === 0) {
        return row.slice(0);
    }
    if (formIndex === 1) {
        return row.slice(0).reverse();
    }
    if (formIndex === 2) {
        for (i = 0; i < row.length; i++) {
            result.push(mod(row[0] - (row[i] - row[0]), 12));
        }
        return result;
    }
    for (i = row.length - 1; i >= 0; i--) {
        result.push(mod(row[0] - (row[i] - row[0]), 12));
    }
    return result;
}

function chooseVoice(previousVoice, recentVoices, profileData, t, eventIndex, role, mirrorEvent) {
    if (profileData.openingVoices && eventIndex < profileData.openingVoices.length) {
        return {
            voice: profileData.openingVoices[eventIndex],
            reason: "documented opening colour plan"
        };
    }

    var weights = [];
    var reasons = [];
    var material = materialForProfile(profileData);
    for (var voice = 1; voice <= INSTRUMENTS.length; voice++) {
        var instrument = INSTRUMENTS[voice - 1];
        var weight = 0.35;
        var voiceReasons = [];

        if (voice === previousVoice) {
            weight *= 0.06;
            voiceReasons.push("exact colour repetition penalized");
        } else if (previousVoice > 0 && instrument.family !== INSTRUMENTS[previousVoice - 1].family) {
            weight += 0.42 + config.timbralContrast * 0.82;
            voiceReasons.push("polychrome family contrast");
        } else {
            weight += 0.72 + config.coherence * 0.72 - config.timbralContrast * 0.22;
            voiceReasons.push("instrumental-family continuity");
        }

        if (previousVoice > 0) {
            var affinity = timbralAffinity(previousVoice, voice);
            if (affinity > 0) {
                weight += affinity * (0.65 + config.coherence * 1.25);
                voiceReasons.push("documented timbral affinity");
            }
        }

        if (recentVoices.indexOf(voice) >= 0) {
            weight *= 0.45;
            voiceReasons.push("recent colour economy");
        }
        if (mirrorEvent) {
            if (voice === mirrorEvent.voice) {
                weight += 2.1 * (1 - config.metamorphosis * 0.65);
                voiceReasons.push("timbral return across formal axis");
            } else {
                var mirrorAffinity = timbralAffinity(mirrorEvent.voice, voice);
                if (mirrorAffinity > 0) {
                    weight += mirrorAffinity * (0.7 + config.metamorphosis * 1.7);
                    voiceReasons.push("metamorphosed mirror colour");
                }
            }
        }
        if (role === "axis" && profileData.axisVoices && profileData.axisVoices.indexOf(voice) >= 0) {
            weight += 4.2;
            voiceReasons.push("profile axis timbre");
        }
        if (role === "pedal" && profileData.focalVoices && profileData.focalVoices.indexOf(voice) >= 0) {
            weight += 3.2;
            voiceReasons.push("focal-pitch carrier");
        }
        if (profileData.voiceWeights && profileData.voiceWeights.length === 10) {
            weight *= Math.max(0.05, Number(profileData.voiceWeights[voice - 1]));
            if (profileData.voiceWeights[voice - 1] > 1.2) {
                voiceReasons.push("movement-specific colour field");
            }
        }
        if (profileData.id === "op10-iii" && (voice === 5 || voice === 6 || voice === 7)) {
            weight *= 1.65;
            voiceReasons.push("high resonant sound field");
        }
        if (profileData.id === "op10-v" && t > 0.78 && (voice === 5 || voice === 6 || voice === 7)) {
            weight *= 1.5;
            voiceReasons.push("epilogue resonance");
        }
        if (material.epilogueStart !== undefined && t >= material.epilogueStart && material.epilogueVoices) {
            if (material.epilogueVoices.indexOf(voice) >= 0) {
                weight *= 2.1;
                voiceReasons.push("Reutter epilogue colour reduction");
            } else if (voice <= 4 || voice === 7) {
                weight *= 0.42;
                voiceReasons.push("epilogue colour economy");
            }
        }
        weights.push(weight);
        reasons.push(voiceReasons);
    }
    var chosen = weightedIndex(weights);
    var chosenReasons = reasons[chosen];
    if (chosenReasons.length === 0) {
        chosenReasons.push("balanced instrumental availability");
    }
    return {
        voice: chosen + 1,
        reason: chosenReasons.slice(0, 3).join("; ")
    };
}

function timbralAffinity(firstVoice, secondVoice) {
    if (firstVoice === secondVoice) {
        return 0;
    }
    var low = Math.min(firstVoice, secondVoice);
    var high = Math.max(firstVoice, secondVoice);
    return TIMBRAL_AFFINITIES[low + ":" + high] || 0;
}

function placeInRegister(pitchClass, voice, t, activityValue, eventIndex, previousEvent, groupInfo, mirrorEvent, profileData) {
    var instrument = INSTRUMENTS[voice - 1];
    var candidates = [];
    for (var midi = instrument.low; midi <= instrument.high; midi++) {
        if (mod(midi, 12) === pitchClass) {
            candidates.push(midi);
        }
    }

    var center = (instrument.comfortLow + instrument.comfortHigh) * 0.5;
    var arch = Math.sin(Math.PI * t);
    if (profileData.registerCurve) {
        arch = interpolate(profileData.registerCurve, t);
    }
    var comfortSpan = instrument.comfortHigh - instrument.comfortLow;
    var target = instrument.comfortLow + clamp(arch, 0.08, 0.92) * comfortSpan;

    if (mirrorEvent) {
        var mirrorMidi = mirrorEvent.pitchCents / 100;
        var displacement = config.metamorphosis > 0.5 && random01() < config.metamorphosis ?
            (random01() < 0.5 ? -12 : 12) : 0;
        target = mirrorMidi + displacement;
    } else if (previousEvent && groupInfo.position > 0) {
        var direction = motifDirection(profileData, groupInfo);
        if (direction !== 0) {
            target = previousEvent.pitchCents / 100 + direction * (2 + 4 * config.coherence);
        } else if (config.lyricism > 0.55) {
            target = previousEvent.pitchCents / 100 + (random01() < 0.5 ? -1 : 1) * 3;
        }
    }

    var registerRisk = profileData.registerRisk === undefined ? 0.08 : profileData.registerRisk;
    var structuralPeak = activityValue > 0.78 || Math.abs(t - (profileData.formalAxis || 0.58)) < 0.05;
    if (structuralPeak && random01() < registerRisk) {
        target += (random01() < 0.58 ? 1 : -1) * comfortSpan * (0.35 + activityValue * 0.22);
    }

    var best = candidates[0];
    var bestDistance = registerCandidateCost(best, target, instrument, structuralPeak, registerRisk);
    for (var i = 1; i < candidates.length; i++) {
        var distance = registerCandidateCost(candidates[i], target, instrument, structuralPeak, registerRisk);
        if (distance < bestDistance) {
            best = candidates[i];
            bestDistance = distance;
        }
    }
    return best;
}

function registerCandidateCost(midi, target, instrument, structuralPeak, registerRisk) {
    var cost = Math.abs(midi - target);
    if (midi < instrument.comfortLow) {
        cost += (instrument.comfortLow - midi) * (structuralPeak ? 1.5 : 5.5) + (1 - registerRisk) * 7;
    } else if (midi > instrument.comfortHigh) {
        cost += (midi - instrument.comfortHigh) * (structuralPeak ? 1.5 : 5.5) + (1 - registerRisk) * 7;
    }
    if (midi <= instrument.low + 1 || midi >= instrument.high - 1) {
        cost += 18;
    }
    return cost;
}

function motifDirection(profileData, groupInfo) {
    if (profileData.gestureContour && profileData.gestureContour.length > 0) {
        var contour = profileData.gestureContour;
        var position = mod(groupInfo.position - 1, contour.length);
        var direction = contour[position];
        if (profileData.responseContour && groupInfo.index % 2 === 1) {
            direction = profileData.responseContour[mod(groupInfo.position - 1, profileData.responseContour.length)];
        }
        return direction;
    }
    if (groupInfo.position === 1) {
        return 1;
    }
    if (groupInfo.position === 2) {
        return -1;
    }
    return 0;
}

function chooseDurationBeats(activityValue, profileData, t, groupInfo, mirrorEvent, groupPlan) {
    if (groupPlan && groupPlan.rhythmCell && groupPlan.rhythmCell.length) {
        if (groupPlan.texture === "pedal-tremolo" || !mirrorEvent || random01() > config.coherence * 0.22) {
            return groupPlan.rhythmCell[groupInfo.position % groupPlan.rhythmCell.length];
        }
    }
    if (mirrorEvent && random01() < config.coherence * (1 - config.metamorphosis * 0.45)) {
        return mirrorEvent.durationBeats;
    }
    if (groupInfo.leader && groupInfo.position > 0 && random01() < config.coherence * 0.52) {
        return groupInfo.leader.durationBeats;
    }
    var options;
    if (activityValue < 0.2) {
        options = [1.5, 2, 3];
    } else if (activityValue < 0.42) {
        options = [0.75, 1, 1.5, 2];
    } else if (activityValue < 0.7) {
        options = [0.5, 2 / 3, 0.75, 1];
    } else {
        options = [0.25, 1 / 3, 0.5, 2 / 3];
    }

    if (profileData.id === "op10-iii") {
        options = [1.5, 2, 3, 4];
    }
    if (profileData.id === "op10-v" && t > 0.76) {
        options = [0.25, 0.5, 0.75, 1.5];
    }
    if (config.lyricism > 0.72 && random01() < config.lyricism * 0.24) {
        options = options.concat([1.5, 2]);
    }
    return options[Math.floor(random01() * options.length)];
}

function chooseInterOnsetBeats(durationBeats, activityValue, profileData, t, groupInfo, groupPlan) {
    var overlapFactor = 1.45 - config.density * 1.05;
    var silenceFactor = 0.68 + config.silence * 1.42;
    var desired = durationBeats * overlapFactor * silenceFactor;

    if (groupPlan && groupPlan.texture === "pedal-tremolo") {
        desired = durationBeats * (0.58 + random01() * 0.24);
    } else if (groupPlan && groupPlan.texture === "solo-line" && groupInfo.position < groupInfo.size - 1) {
        desired *= 0.48 + (1 - config.lyricism) * 0.22;
    } else if (groupPlan && (groupPlan.texture === "exchange" || groupPlan.texture === "echo") &&
            groupInfo.position < groupInfo.size - 1) {
        desired *= 0.62;
    }

    if (profileData.id === "op10-iv") {
        desired *= 1.22;
    }
    if (profileData.id === "op10-v" && t > 0.76) {
        desired *= 1.5;
    }
    if (activityValue > 0.72) {
        desired *= 0.78;
    }
    if (groupInfo.position === groupInfo.size - 1) {
        desired += groupBreath(profileData, activityValue, t);
    }
    if (profileData.silenceAxes) {
        for (var i = 0; i < profileData.silenceAxes.length; i++) {
            if (Math.abs(t - profileData.silenceAxes[i]) < 0.035) {
                desired *= 1.8;
            }
        }
    }
    return nearestValue(desired, [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 3]);
}

function chooseArticulation(voice, durationBeats, activityValue, t, profileData, groupPlan) {
    var technique = groupPlan.sectionStyle.techniques[voice];
    var family = INSTRUMENTS[voice - 1].family;
    var mode = groupPlan.sectionStyle.articulations[family];
    if (groupPlan.texture === "pedal-tremolo") {
        return (voice === 5 || voice === 7 || voice >= 8) && random01() < 0.42 ? "trill" : "tremolo1";
    }
    if (technique === "flatter") {
        return "tremolo1";
    }
    if (groupPlan.texture === "homorhythm") {
        if (mode === "accented") {
            return durationBeats <= 0.75 ? "accentstaccato" : "accent";
        }
        if (mode === "detached" || mode === "punctuated") {
            return durationBeats <= 0.75 ? "staccatissimo" : "portato";
        }
        return mode === "portato" ? "portato" : "";
    }
    if (mode === "legato" || mode === "sustained" || mode === "resonant") {
        return "";
    }
    if (mode === "detached" || mode === "punctuated") {
        return durationBeats <= 0.75 ? "staccato" : "portato";
    }
    if (mode === "accented") {
        return durationBeats <= 0.75 ? "accentstaccato" : "accent";
    }
    return mode === "portato" ? "portato" : "";
}

function chooseAnnotation(profileData, t, groupPlan, groupInfo, voice, activityValue, articulation, state) {
    var instrument = INSTRUMENTS[voice - 1];
    var technique = groupPlan.sectionStyle.techniques[voice];
    var previousTechnique = state.techniques[voice];
    if (previousTechnique !== technique) {
        state.techniques[voice] = technique;
        if (technique === "muted" && MUTE_VOICES.indexOf(voice) >= 0) { return "mit Dämpfer"; }
        if (technique === "pizzicato" && STRING_VOICES.indexOf(voice) >= 0) { return "pizz."; }
        if (technique === "col-legno" && STRING_VOICES.indexOf(voice) >= 0) { return "col legno"; }
        if (technique === "flatter" && FLATTER_VOICES.indexOf(voice) >= 0) { return "Flatterzunge"; }
        if (technique === "soft-mallet" && voice === 7) { return "mit Schwammschlägel"; }
        if (technique === "arco" && (previousTechnique === "pizzicato" || previousTechnique === "col-legno")) { return "arco"; }
        if (technique === "ordinary" && previousTechnique === "flatter") { return "ordinario"; }
        if (technique === "ordinary" && previousTechnique === "muted" && voice <= 4) { return "ohne Dämpfer"; }
        if (technique === "arco" && previousTechnique === "muted") { return "Dämpfer ab"; }
    }
    if (groupPlan.texture === "pedal-tremolo") {
        if (!state.flags.pedal) {
            state.flags.pedal = 1;
            return "kaum hörbar";
        }
        if (t > 0.78 && !state.flags.pedalFade) {
            state.flags.pedalFade = 1;
            return "verklingend";
        }
        return "";
    }
    if (groupInfo.position !== 0) {
        return "";
    }
    if (state.expressionGroups[groupInfo.index] || random01() > expressionProbability(profileData, t, activityValue)) {
        return "";
    }
    state.expressionGroups[groupInfo.index] = 1;
    return chooseExpressionWord(profileData, t, activityValue, instrument.family, state);
}

function expressionProbability(profileData, t, activityValue) {
    var probability = 0.13 + config.lyricism * 0.1;
    if (profileData.id === "op10-ii" || profileData.id === "op10-v") {
        probability += activityValue * 0.08;
    }
    if (profileData.id === "op10-iii") {
        probability *= 0.72;
    }
    return probability;
}

function chooseExpressionWord(profileData, t, activityValue, family, state) {
    var category;
    if (activityValue < 0.3 || profileData.id === "op10-i" || profileData.id === "op10-iii" || (profileData.id === "op10-v" && t > 0.76)) {
        category = random01() < 0.55 ? "quiet" : "lyrical";
    } else if (activityValue > 0.72) {
        category = random01() < 0.58 ? "forceful" : "mobile";
    } else {
        category = random01() < config.lyricism ? "lyrical" : "mobile";
    }
    var pool = EXPRESSION_WORDS[category].slice(0);
    if (family === 2) {
        pool = pool.concat(["nachklingend", "Resonanz stehen lassen"]);
    }
    var unused = [];
    for (var i = 0; i < pool.length; i++) {
        if (!state.usedWords[pool[i]]) { unused.push(pool[i]); }
    }
    if (unused.length === 0) { unused = pool; }
    var word = unused[Math.floor(random01() * unused.length)];
    state.usedWords[word] = 1;
    return word;
}

function claimFlag(state, key) {
    if (state.flags[key]) {
        return false;
    }
    state.flags[key] = 1;
    return true;
}

function claimOccasion(index, divisor) {
    return index > 0 && index % divisor === 0;
}

function applyClosures(events, profileData) {
    if (events.length === 0) {
        return;
    }

    var material = materialForProfile(profileData);
    if (material.closurePitchClass !== undefined) {
        forcePitchClass(events[events.length - 1], material.closurePitchClass);
        events[events.length - 1].decisionReason += "; profile closure pitch";
    }
    if (material.closurePitchClasses && events.length >= 2) {
        forcePitchClass(events[events.length - 2], material.closurePitchClasses[0]);
        forcePitchClass(events[events.length - 1], material.closurePitchClasses[1]);
    }
    if (profileData.id === "op10-iv" && events.length > 2) {
        events[events.length - 1].voice = events[0].voice;
        forcePitchClass(events[events.length - 1], events[events.length - 1].pitchClass);
        events[events.length - 1].decisionReason += "; return of opening colour";
    }
}

function forcePitchClass(event, pitchClass) {
    var instrument = INSTRUMENTS[event.voice - 1];
    var targetMidi = Math.round(event.pitchCents / 100);
    var best = targetMidi;
    var bestDistance = 999;
    for (var midi = instrument.low; midi <= instrument.high; midi++) {
        if (mod(midi, 12) === pitchClass && Math.abs(midi - targetMidi) < bestDistance) {
            best = midi;
            bestDistance = Math.abs(midi - targetMidi);
        }
    }
    event.pitchClass = pitchClass;
    event.pitchCents = best * 100;
}

function enforceMonophonicOnsets(events) {
    var occupied = {};
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if ((event.annotation === "mit Dämpfer" || event.annotation === "ohne Dämpfer" || event.annotation === "Dämpfer ab") &&
                MUTE_VOICES.indexOf(event.voice) < 0) {
            event.annotation = "";
        }
        var key = event.voice + ":" + round3(event.onsetBeats);
        if (!occupied[key]) {
            occupied[key] = 1;
            continue;
        }
        if (!INSTRUMENTS[event.voice - 1].monophonic) {
            continue;
        }
        var family = INSTRUMENTS[event.voice - 1].family;
        var alternatives = FAMILY_VOICES[family];
        var replacement = 0;
        for (var altIndex = 0; altIndex < alternatives.length; altIndex++) {
            var alt = alternatives[altIndex];
            if (!occupied[alt + ":" + round3(event.onsetBeats)]) {
                replacement = alt;
                break;
            }
        }
        if (!replacement) {
            for (var voice = 1; voice <= 10; voice++) {
                if (!INSTRUMENTS[voice - 1].monophonic || !occupied[voice + ":" + round3(event.onsetBeats)]) {
                    replacement = voice;
                    break;
                }
            }
        }
        if (replacement) {
            event.voice = replacement;
            forcePitchClass(event, event.pitchClass);
            event.decisionReason += "; monophonic playability reassignment";
            key = event.voice + ":" + round3(event.onsetBeats);
            occupied[key] = 1;
        }
    }
}

function capPedalConcurrency(events, beatMs) {
    var pedals = [];
    for (var i = 0; i < events.length; i++) {
        if (events[i].groupTexture === "pedal-tremolo") { pedals.push(events[i]); }
    }
    pedals.sort(function (a, b) { return a.onsetBeats - b.onsetBeats; });
    for (var index = 0; index < pedals.length; index++) {
        var current = pedals[index];
        var active = [];
        for (var earlier = 0; earlier < index; earlier++) {
            if (pedals[earlier].onsetBeats + pedals[earlier].durationBeats > current.onsetBeats) {
                active.push(pedals[earlier]);
            }
        }
        while (active.length >= 3) {
            active.sort(function (a, b) {
                return (a.onsetBeats + a.durationBeats) - (b.onsetBeats + b.durationBeats);
            });
            var closing = active.shift();
            closing.durationBeats = Math.max(0.125, (current.onsetBeats - closing.onsetBeats) * 0.92);
            closing.durationMs = closing.durationBeats * beatMs;
            closing.decisionReason += "; pedal-layer density closure";
        }
    }
}

/*
 * Quantization can turn two different attacks into an apparent wind chord if
 * the earlier duration continues beyond the next attack.  This second pass
 * therefore enforces monody over complete sounding intervals, not merely at
 * identical onset keys.
 */
function enforceMonophonicLines(events, beatMs) {
    for (var voice = 1; voice <= INSTRUMENTS.length; voice++) {
        if (!INSTRUMENTS[voice - 1].monophonic) { continue; }
        var line = [];
        for (var i = 0; i < events.length; i++) {
            if (events[i].voice === voice) { line.push(events[i]); }
        }
        line.sort(function (a, b) {
            return a.onsetBeats === b.onsetBeats ? a.index - b.index : a.onsetBeats - b.onsetBeats;
        });
        for (var j = 0; j + 1 < line.length; j++) {
            var current = line[j];
            var next = line[j + 1];
            var available = next.onsetBeats - current.onsetBeats;
            if (available > 0 && current.durationBeats > available) {
                current.durationBeats = Math.max(0.125, available * 0.92);
                current.durationMs = current.durationBeats * beatMs;
                current.decisionReason += "; monophonic duration closure";
            }
        }
    }
}

function sanitizeTechniqueGrammar(events) {
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.technique === "muted" && MUTE_VOICES.indexOf(event.voice) < 0) {
            event.technique = event.voice >= 8 ? "arco" : "ordinary";
            if (event.annotation === "mit Dämpfer" || event.annotation === "ohne Dämpfer" || event.annotation === "Dämpfer ab") { event.annotation = ""; }
        }
        if (event.technique === "flatter" && FLATTER_VOICES.indexOf(event.voice) < 0) {
            event.technique = event.voice >= 8 ? "arco" : "ordinary";
            if (event.annotation === "Flatterzunge") { event.annotation = ""; }
        }
        if ((event.technique === "pizzicato" || event.technique === "col-legno" || event.technique === "arco") &&
                STRING_VOICES.indexOf(event.voice) < 0) {
            event.technique = "ordinary";
            if (event.annotation === "pizz." || event.annotation === "col legno" || event.annotation === "arco") {
                event.annotation = "";
            }
        }
    }
}

function applyPhrasePlans(events) {
    var groups = {};
    var phraseNumber = 0;
    for (var i = 0; i < events.length; i++) {
        var key = events[i].groupIndex + ":" + events[i].voice;
        if (!groups[key]) { groups[key] = []; }
        groups[key].push(events[i]);
    }
    for (var groupKey in groups) {
        if (!groups.hasOwnProperty(groupKey)) { continue; }
        var phrase = groups[groupKey];
        if (phrase.length < 2 || phrase.length > 6 || phrase[0].synchronized) { continue; }
        var mode = phrase[0].articulationMode;
        var technique = phrase[0].technique;
        var span = phrase[phrase.length - 1].onsetBeats + phrase[phrase.length - 1].durationBeats - phrase[0].onsetBeats;
        if ((mode !== "legato" && mode !== "portato" && mode !== "sustained") ||
                technique === "pizzicato" || technique === "col-legno" || span > 8) {
            continue;
        }
        phraseNumber++;
        phrase[0].phraseSlurStart = phraseNumber;
        phrase[phrase.length - 1].phraseSlurStop = phraseNumber;
        for (var phraseIndex = 0; phraseIndex < phrase.length; phraseIndex++) {
            phrase[phraseIndex].phraseId = phraseNumber;
        }
    }
}

function emitDynamics() {
    var byVoice = eventsByVoice();
    var commandCount = 0;

    for (var voice = 1; voice <= 10; voice++) {
        var voiceEvents = byVoice[voice];
        var keypoints = chooseDynamicKeypoints(voiceEvents);

        for (var i = 0; i < keypoints.length; i++) {
            var current = keypoints[i];
            var next = i + 1 < keypoints.length ? keypoints[i + 1] : null;
            var token = DYNAMIC_MARKS[current.dynamicLevel];
            var shortPhraseHairpin = next && next.groupIndex === current.groupIndex &&
                next.onsetBeats - current.onsetBeats <= maxHairpinBeats(activeProfile());
            if (shortPhraseHairpin && next.dynamicLevel > current.dynamicLevel) {
                token += "<";
            } else if (shortPhraseHairpin && next.dynamicLevel < current.dynamicLevel) {
                token += ">";
            }
            selectChord(voice, current.localChord);
            outlet(3, ["setslot", "[", 20, token, "]"]);
            outlet(3, ["clearselection"]);
            commandCount++;
        }
    }
    return commandCount;
}

function maxHairpinBeats(profileData) {
    if (profileData.id === "op10-iii") { return 3; }
    if (profileData.id === "op10-ii" || profileData.id === "op10-v") { return 2; }
    return 2.5;
}

function emitArticulations() {
    var localCounters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var commandCount = 0;

    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        localCounters[event.voice]++;
        if (!event.articulation) {
            continue;
        }
        selectChord(event.voice, localCounters[event.voice]);
        outlet(3, ["setslot", "[", 22, event.articulation, "]"]);
        outlet(3, ["clearselection"]);
        commandCount++;
    }
    return commandCount;
}

function emitAnnotations() {
    var localCounters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var commandCount = 0;
    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        localCounters[event.voice]++;
        if (!event.annotation) {
            continue;
        }
        selectChord(event.voice, localCounters[event.voice]);
        outlet(3, ["setslot", "[", 24, event.annotation, "]"]);
        outlet(3, ["clearselection"]);
        commandCount++;
    }
    return commandCount;
}

function emitPhraseMetadata() {
    var localCounters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var count = 0;
    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        localCounters[event.voice]++;
        var token = "";
        if (event.phraseSlurStart) { token = "__WEBERN_SLUR_START_" + event.phraseSlurStart; }
        if (event.phraseSlurStop) { token = "__WEBERN_SLUR_STOP_" + event.phraseSlurStop; }
        if (!token) { continue; }
        selectChord(event.voice, localCounters[event.voice]);
        outlet(3, ["setslot", "[", 25, token, "]"]);
        outlet(3, ["clearselection"]);
        count++;
    }
    return count;
}

function scoreMeasureCount() {
    var totalBeats = 4;
    for (var i = 0; i < generatedEvents.length; i++) {
        totalBeats = Math.max(totalBeats, generatedEvents[i].onsetBeats + generatedEvents[i].durationBeats);
    }
    return Math.max(1, Math.ceil(totalBeats / 4));
}

function emitGlobalDirections() {
    var profileData = activeProfile();
    var plan = profileData.tempoPlan || [[0, 1, "tempo"]];
    var measureCount = scoreMeasureCount();
    var usedMeasures = {};
    var count = 0;
    outlet(3, ["cleartempi"]);
    outlet(3, ["clearmarkers"]);
    for (var planIndex = 0; planIndex < plan.length; planIndex++) {
        var measure = 1 + Math.floor(clamp(Number(plan[planIndex][0]), 0, 1) * Math.max(0, measureCount - 1));
        while (usedMeasures[measure] && measure < measureCount) {
            measure++;
        }
        if (usedMeasures[measure]) {
            continue;
        }
        usedMeasures[measure] = 1;
        var bpm = Math.round(clamp(config.tempo * Number(plan[planIndex][1]), 24, 220));
        outlet(3, ["addtempo", measure, "[", "1/4", bpm, "]"]);
        var label = planIndex === 0 && profileData.initialMarking ? profileData.initialMarking : String(plan[planIndex][2] || "");
        if (label) {
            var words = label.split(" ");
            outlet(3, ["addmarker", "[", measure, "]", "["].concat(words).concat(["]"]));
        }
        count++;
    }
    return count;
}

function emitMeterChanges() {
    var profileData = activeProfile();
    var measureCount = scoreMeasureCount();
    if (measureCount < 5 || profileData.id === "op10-iii" || random01() > 0.42) {
        return 0;
    }
    var candidates = profileData.id === "op10-ii" || profileData.id === "op10-v" ? [[3, 4], [5, 8]] : [[3, 4], [2, 4]];
    var signature = candidates[Math.floor(random01() * candidates.length)];
    var measure = 2 + Math.floor(random01() * Math.max(1, measureCount - 3));
    outlet(3, ["unsel", "all"]);
    outlet(3, ["sel", "measure", "range", "[", measure, "]"]);
    outlet(3, ["measureinfo", "[", signature[0], signature[1], "]"]);
    outlet(3, ["clearselection"]);
    if (measure + 1 <= measureCount) {
        outlet(3, ["sel", "measure", "range", "[", measure + 1, "]"]);
        outlet(3, ["measureinfo", "[", 4, 4, "]"]);
        outlet(3, ["clearselection"]);
    }
    return 1;
}

function selectChord(voice, localChord) {
    outlet(3, ["unsel", "all"]);
    outlet(3, ["sel", "chord", voice, "any", localChord, "@tiemode", "all", "@skiprests", 1]);
}

function eventsByVoice() {
    var result = {};
    var counters = {};
    var voice;
    for (voice = 1; voice <= 10; voice++) {
        result[voice] = [];
        counters[voice] = 0;
    }
    for (var i = 0; i < generatedEvents.length; i++) {
        var event = generatedEvents[i];
        counters[event.voice]++;
        event.localChord = counters[event.voice];
        result[event.voice].push(event);
    }
    return result;
}

function chooseDynamicKeypoints(events) {
    if (events.length === 0) {
        return [];
    }
    var result = [events[0]];
    var last = events[0];
    for (var i = 1; i < events.length - 1; i++) {
        var event = events[i];
        var phraseBoundary = event.groupIndex !== last.groupIndex;
        var localChange = event.groupIndex === last.groupIndex && event.dynamicLevel !== last.dynamicLevel;
        if ((phraseBoundary && event.localChord - last.localChord >= 2) || localChange) {
            result.push(event);
            last = event;
        }
    }
    var finalEvent = events[events.length - 1];
    if (finalEvent.localChord !== result[result.length - 1].localChord &&
            finalEvent.dynamicLevel !== result[result.length - 1].dynamicLevel) {
        result.push(finalEvent);
    }
    return result;
}

function dynamicLevelForValue(value, dynamicRange) {
    var low = clamp(Math.floor(dynamicRange[0]), 0, DYNAMIC_MARKS.length - 1);
    var high = clamp(Math.floor(dynamicRange[1]), low, DYNAMIC_MARKS.length - 1);
    return Math.round(low + clamp(value, 0, 1) * (high - low));
}

function dynamicToVelocity(level) {
    return Math.round(24 + level * 10.5);
}

function combinedCurve(t, userPoints, profilePoints, userWeight) {
    var userValue = interpolate(userPoints, t);
    var profileValue = interpolate(profilePoints, t);
    return clamp(userValue * userWeight + profileValue * (1 - userWeight), 0, 1);
}

function interpolate(points, t) {
    if (!points || points.length === 0) {
        return 0.5;
    }
    if (points.length === 1) {
        return points[0][1];
    }
    if (t <= points[0][0]) {
        return points[0][1];
    }
    for (var i = 0; i < points.length - 1; i++) {
        var left = points[i];
        var right = points[i + 1];
        if (t >= left[0] && t <= right[0]) {
            var width = right[0] - left[0];
            var alpha = width === 0 ? 0 : (t - left[0]) / width;
            return left[1] + alpha * (right[1] - left[1]);
        }
    }
    return points[points.length - 1][1];
}

function parsePoints(args, fallback) {
    if (!args || args.length < 4 || args.length % 2 !== 0) {
        post("webernPersonaEngine: contour expects x/y pairs\n");
        return fallback;
    }
    var raw = [];
    var minX = Number(args[0]);
    var maxX = Number(args[args.length - 2]);
    for (var i = 0; i < args.length; i += 2) {
        raw.push([Number(args[i]), clamp(Number(args[i + 1]), 0, 1)]);
        minX = Math.min(minX, Number(args[i]));
        maxX = Math.max(maxX, Number(args[i]));
    }
    raw.sort(function (a, b) { return a[0] - b[0]; });
    var width = maxX - minX;
    for (var pointIndex = 0; pointIndex < raw.length; pointIndex++) {
        raw[pointIndex][0] = width === 0 ? 0 : (raw[pointIndex][0] - minX) / width;
    }
    return raw;
}

function loadProfiles() {
    if (typeof File === "undefined") {
        profiles = FALLBACK_PROFILES;
        return;
    }
    var file = null;
    try {
        file = new File("webern_persona_profiles.json", "read");
        if (!file.isopen) {
            profiles = FALLBACK_PROFILES;
            return;
        }
        var text = "";
        while (file.position < file.eof) {
            text += file.readline(4096);
        }
        file.close();
        var parsed = JSON.parse(text);
        if (parsed.profiles && parsed.profiles.length >= 6) {
            profiles = parsed.profiles;
        }
    } catch (error) {
        if (file && file.isopen) {
            file.close();
        }
        profiles = FALLBACK_PROFILES;
        post("webernPersonaEngine: using built-in profiles (" + error + ")\n");
    }
}

function activeProfile() {
    return profiles[clamp(config.profileIndex, 0, profiles.length - 1)];
}

function materialForProfile(profileData) {
    var base = REUTTER_MATERIAL[profileData && profileData.id] || REUTTER_MATERIAL["op10-synthesis"];
    if (!profileData || !profileData.reutterSelection) { return base; }
    var result = {};
    var key;
    for (key in base) {
        if (base.hasOwnProperty(key)) { result[key] = base[key]; }
    }
    for (key in profileData.reutterSelection) {
        if (profileData.reutterSelection.hasOwnProperty(key)) {
            result[key] = profileData.reutterSelection[key];
        }
    }
    return result;
}

function weightedIndex(weights) {
    var total = 0;
    var i;
    for (i = 0; i < weights.length; i++) {
        total += Math.max(0, weights[i]);
    }
    var target = random01() * total;
    for (i = 0; i < weights.length; i++) {
        target -= Math.max(0, weights[i]);
        if (target <= 0) {
            return i;
        }
    }
    return weights.length - 1;
}

function shuffle(values) {
    var result = values.slice(0);
    for (var i = result.length - 1; i > 0; i--) {
        var j = Math.floor(random01() * (i + 1));
        var temporary = result[i];
        result[i] = result[j];
        result[j] = temporary;
    }
    return result;
}

function nearestValue(value, options) {
    var best = options[0];
    var distance = Math.abs(value - best);
    for (var i = 1; i < options.length; i++) {
        var candidateDistance = Math.abs(value - options[i]);
        if (candidateDistance < distance) {
            best = options[i];
            distance = candidateDistance;
        }
    }
    return best;
}

function shortestDistance(a, b) {
    var directed = mod(b - a, 12);
    return Math.min(directed, 12 - directed);
}

function seedRandom(value) {
    rngState = normalizeSeed(value);
}

function random01() {
    rngState = (rngState * 16807) % 2147483647;
    return (rngState - 1) / 2147483646;
}

function normalizeSeed(value) {
    var integer = Math.abs(Math.floor(Number(value))) % 2147483647;
    return integer === 0 ? 1 : integer;
}

function status() {
    outlet(2, arrayfromargs(arguments));
}

function mod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function round3(value) {
    return Math.round(value * 1000) / 1000;
}
