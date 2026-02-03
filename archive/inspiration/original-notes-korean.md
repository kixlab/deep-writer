Fostering Appropriate Reliance, Preserving Agency, and Supporting Authorship in AI-Assisted Writing

Context: https://openai.com/ko-KR/prism/
Can we provide users with a better experience in the Prism while maintaining an ``appropriate reliance`` level?

Main Claim: The reasons users lose their sense of agency and fall into overreliance or underreliance -- rather than appropriate reliance -- are ``multifaceted`` (especially in writing).

Appropriate Reliance:
## R1: In existing systems, users cannot monitor their own reliance level across an entire session.
> Users should be able to monitor the degree of their reliance.
>> The system should provide interpretability regarding the basis for judging that degree.
> Users should be able to choose where to look more closely and where to look less closely.

Limitations of Previous Research


>> Tracking the text editing process is more like excavating layered history (akin to digging up fossils) -- but will users actually review this history?
CONS: Likely not -- it is too burdensome.
PROS: Users who want to edit the text further may want to check where each idea originated and how they or the AI agent contributed, especially when searching for the right ``words`` or ``phrases`` in professional writing.


Preserving Agency:
Overreliance: 1) Users lack criteria for distinguishing good writing, and 2) users do not use writing as a tool for thinking.
## R2: Existing systems model the user as a supervisor rather than a collaborator. A request is treated as something that must always be fulfilled.
1) A Matter of Writing Ability
Most AI-assisted writing ends up as bad writing.
AI can and should accommodate user requests, but sometimes a user's request may itself be a ``bad`` request. How can we mitigate this? How can we support novice writers? 1) By providing examples, 2) by posing Socratic questions, and 3) by ``saying no`` or ``proposing a different direction`` in response to the user's request.

## R3: Existing systems are not concerned with helping users develop the mental model needed for autonomous writing. They are only concerned with assisting the user well.
This is a matter of mental model rather than ability.
In cognitivism, novice writers follow a knowledge-telling mental model, whereas experts use writing as a ``knowledge-transforming`` process (Bereiter & Scardamalia). Writing is a means of refining thought before it is a productivity tool, and from this perspective, ``not intervening``, ``encouraging users not to use the system``, or ``leaving a void for thinking`` is important.
We can compose a paragraph by supplying several ``words``, but it is through forging connections between words and trimming sentences that ``thinking`` actually happens.

>> Expert writers refine AI suggestions before incorporating them.


## R4: In existing systems, underreliance and overreliance stem from the difficulty of conveying user intent at a ``fine-grained`` level.
Difficulty conveying intent with precision.
3) Coarse-Grained Controllability
> We CLAIM that current human-AI collaborative writing interfaces lack the UI components needed for users to convey their fine-grained intent.
> During human-AI collaboration, the AI simply writes over the user's text, and its output is commonly misaligned with the user's intent -- yet there is no easy way to reflect the user's intent, goals, or objectives.

## R5: In existing systems, underreliance and overreliance stem from the difficulty of conveying user intent ``easily``.
Difficulty conveying intent with ease.

Users can easily request help in repetitive processes by choosing options or clicking icons.
Users can convey their intent easily by selecting among options provided by the system.
