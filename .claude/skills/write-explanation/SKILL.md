---
name: write-explanation
description: Write or rewrite what a deck says — the phrase under each beat, titles, diagram and brace labels, speaker notes. Use whenever you are deciding the words of a scene (not how it animates), or when an explanation was rejected as too hard, too stiff, too compressed, or badly written.
---

# Writing the explanation

`new-scene` covers the mechanics (beats, slots, motion). This covers the words.

The slide is an **intuition-builder**: a picture and one short spoken phrase per beat. The presenter's voice carries the explanation, so the full sentences live in `notes.ts`. Two failures this skill exists to prevent:

- an explanation that is *technically correct and useless* — every claim true, every term unexplained, every derivation named instead of performed;
- a phrase in the *wrong voice* — a noun fragment or a flat `…한다` declaration that reads like a table of contents, or a chatty `…해요` that reads like an app's marketing copy. The voice is a presenter explaining: **합니다체**.

## 1. Where each kind of word lives

| Place | What it is | Form |
|---|---|---|
| **Phrase** (`Captions`, one per beat) | what you would say while pointing at the screen | one line, 합니다체, everyday words |
| **Title** (`Board title`, scene `title`) | the name of the idea, or the question the scene answers | a few words; `어디를 얼마나 볼까?` |
| **Labels** (diagram node, brace, axis, edge) | names of things | a noun, ≤ 16 characters on a node, ≤ 8 on a brace; module names in the paper's English |
| **Notes** (`notes.ts`, one per beat) | the explanation itself, read aloud | 합니다체, full sentences, 2–3 per beat |

Definitions, numbers with their reasons, paper sections and caveats go in the notes. The phrase never tries to carry them.

## 2. Inventory the vocabulary before writing anything

List every term the source paper uses without defining, then give each one a **beat** in this deck: the picture shows the thing, the phrase says it in everyday words, the note defines it properly. Papers open in the middle of their own argument; a livestream audience has not read them.

> K3 §2.3.3 uses "quantile", "load", "bias", "fixed-step rule" with no definition. Four terms → one whole scene defines quantile on eight numbers you can count; the other three get a scene before the paper's argument starts.

When a paper section *changes* an existing mechanism, write the scene for **how the mechanism normally works** first. The paper's twist is unreadable until the baseline is on screen.

## 3. Order by understanding, not by the paper

**문제 → 도구 → 유도 → 정리 → 구현.**

- **문제** — what goes wrong, in numbers, before any solution exists.
- **도구** — the one idea the argument will lean on, shown on its own.
- **유도** — the argument, one move per beat.
- **정리** — what it buys: how it relates to the thing it replaces.
- **구현** — how it is actually computed at scale.

For systems work, the spine is **what moves, where it lands, what it costs**. A theorem is the answer to "how big must it be" — one beat, late. Say what is ruled out before showing the mechanism, so the mechanism looks inevitable rather than arbitrary.

## 4. No jargon on screen — but module names are names

Jargon is a word for a *process or a quantity* that the audience would not use outside the field. On screen, say what it does:

| 논문의 말 | 화면의 말 |
|---|---|
| 어드밴티지 | 평균과의 차이, 평소보다 얼마나 잘했는지 |
| 롤아웃, 궤적 | 풀이 한 번 |
| softmax를 취한다 | softmax로 합이 1인 비율로 바꿉니다 |
| Top-2 라우팅 | 점수가 높은 Expert 두 개만 일을 합니다 |
| 라그랑주 승수 | 어기면 물리는 값 |

**Never Koreanize a module name.** `Router`, `Expert`, `Query`, `Key`, `Value`, `softmax`, `Attention`, `RMSNorm` are names: write them exactly as the paper does — on diagram nodes, in phrases, in notes. Do not translate them (`전문가`, `질문`, `열쇠`) and do not transliterate them (`라우터`, `어텐션`). The audience has to recognise the same word in the paper, in the figure and in what the presenter says. Plain Korean is for what the module *does*:

| 쓰지 말 것 | 대신 |
|---|---|
| `질문과 열쇠가 얼마나 닮았는지 점수를 냅니다` | `Query와 Key가 얼마나 닮았는지 점수를 냅니다` |
| `라우터가 전문가마다 점수를 매깁니다` | `Router가 Expert마다 점수를 매깁니다` |
| 노드 라벨 `비율` (softmax 블록) | 노드 라벨 `softmax` |

A diagram node that is a module gets its English name; a node that is only a value or an unnamed operation (`점수`, `가중 합`, `출력`) may take a short Korean noun. `Term` gives the word in the phrase the same colour as its node and its symbol.

## 5. The phrase: 발표자가 설명하는 말, 합니다체

Write the phrase the way a presenter says it while pointing at the board. **합니다체**: …합니다, …입니다, …됩니다, …갑니다, …해 보겠습니다.

| 쓰지 말 것 | 왜 | 대신 |
|---|---|---|
| `평균보다 잘한 풀이는 위로, 못한 풀이는 아래로` | 체언으로 끝난 조각 | `평균보다 잘한 풀이는 위로, 못한 풀이는 아래로 갑니다` |
| `모두 통과하면 배울 것이 없다` | 단정형 평서 (`…한다`, `…이다`) | `모두 통과하면 차이가 없어서 배울 것도 없습니다` |
| `그룹 평균을 기준선으로 사용함` | 명사형 어미 | `그룹의 평균이 기준선이 됩니다` |
| `평균은 0.625예요`, `위로 가요`, `더해 볼까요?` | 해요체 — 앱 안내 문구처럼 들린다 | `평균은 0.625입니다`, `위로 갑니다`, `더해 보겠습니다` |
| `점수 산출 후 상위 2개 선택` | 명사 나열, 조어 | `점수가 높은 Expert 두 개만 일을 합니다` |
| `기울기는 q − ℓⱼ` | 기호를 그대로 읽음 | `목표보다 덜 받은 만큼 더 보냅니다` |
| `부호만 쓴 것 — 학습률이 없는 이유` | 붙임표로 붙인 조각 | 두 비트로 나누고, 각각 한 문장으로 |

- **One line.** `stack` layout: up to ~32 characters. `split`: ~20 per line, two lines at most. If it does not fit, it is two beats.
- **One idea.** A phrase with two unrelated clauses is two beats.
- **Open a beat by saying what you are about to do**: `한 그룹의 차이를 전부 더해 보겠습니다`. The question itself belongs in the title, in plain form (`차이를 모두 더하면?`).
- **Concrete numbers** the audience can check against the picture: `16번 중 10번 통과했으니 평균은 0.625입니다`.
- No sentence-final period on a single-sentence phrase; a period only between two sentences.
- Keep `<Term …>` on the same line as the word before it — JSX drops the space otherwise.

## 6. Perform the derivation; naming it is not explaining it

"쌍대를 취하면 분위수가 나옵니다" is a table of contents. A derivation is a `Formula` whose forms change one move per beat, and every move owes the audience two things:

1. **Why this move** — the phrase says it: `평균은 16번 똑같이 빠집니다`.
2. **What it hands you** — the new form on screen.

State the destination up front, as the scene's title question (`차이를 모두 더하면?`), so each move is visibly aimed at something. See `04-sum-to-zero.tsx`.

## 7. Any assertion the audience cannot check is noise

"조각별 선형이라 닫힌 해가 있습니다" tells a viewer who already knew, and nobody else. Replace it with the calculation on numbers small enough to verify on screen (8 values, 16 bars), and make the figure *be* the calculation. Compute every on-screen number in code from the example data; say in the note which numbers are the paper's and which are made-up examples.

## 8. Split rather than compress

When a scene will not fit, the honest move is another scene. Symptoms: a beat carrying two ideas, a phrase that needs two lines, an equation that shrinks, more than six beats. Two 4-beat scenes teach; one 9-beat scene does not.

## 9. Notes: the explanation, as it will be said

One `'<nodeId>/<stepId>'` note per beat, plus one for the scene (`'<nodeId>'`) that says what the scene is for. Each beat's note is 2–3 sentences in **합니다체** — the same voice as the phrase, which is its one-line version — that the presenter can read as written:

- define the term the beat introduces, in a full sentence;
- give the number *and its reason*;
- cite the paper section for anything the paper states (`§4.3.2`), and say so when a figure is a made-up example or the paper does not say.

Notes are the most spoken text in the repo, so they must read as Korean someone says:

| 쓰지 말 것 | 대신 |
|---|---|
| 붙임표를 접착제로 쓰기 | 문장 둘로 끊고 **그래서 / 따라서 / 그런데 / 대신 / 반면**으로 잇는다 |
| `…는 이유입니다`, `…인 셈입니다` ("which is why"의 직역) | 동사로 끝낸다 |
| 조어·압축 (`학습률류`, `통신 0`) | 풀어 쓴다 |
| 절마다 주어가 바뀌는데 주어를 생략 | 바뀌는 자리에서 주어를 밝힌다 |

## 10. Before finishing

- 화면의 문장을 소리 내어 읽어 본다. 발표자가 설명하는 말로 들리는가. `…한다`·`…이다`, 명사, `…해요`로 끝나는 줄이 남았는가.
- 화면에 전문 용어가 남았는가. 남았다면 그 말이 *하는 일*로 바꾼다. 반대로 모듈 이름을 한국어로 바꾼 자리가 있는가. 있다면 논문의 영어 이름으로 되돌린다.
- 정의 없이 쓴 용어가 있는가. 어느 비트의 노트가 정의하는지 정한다.
- 유도에서 건너뛴 자리가 있는가.
- 청중이 화면에서 세어 확인할 수 있는 예가 장면마다 하나는 있는가.
- `npm run review`의 시트를 본다. 넘치면 문장을 줄이기 전에 비트나 장면을 나눌 수 있는지부터 본다.
