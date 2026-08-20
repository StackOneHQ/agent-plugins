# Changelog

## [3.1.0](https://github.com/StackOneHQ/agent-plugins/compare/stackone-agent-plugins-v3.0.0...stackone-agent-plugins-v3.1.0) (2026-08-20)


### Features

* **ENG-593:** defender-antigravity - sibling plugin for Google Antigravity CLI ([#26](https://github.com/StackOneHQ/agent-plugins/issues/26)) ([0ab666f](https://github.com/StackOneHQ/agent-plugins/commit/0ab666f77ed52ca36e533554c029ca8b23a0ae94))


### Bug Fixes

* **ENG-1961:** defender plugin — payload floor, cue threshold, bump to 0.8.2 ([#30](https://github.com/StackOneHQ/agent-plugins/issues/30)) ([c0b5d7e](https://github.com/StackOneHQ/agent-plugins/commit/c0b5d7ec57a7788ce36bc5120feabcec2ed1858c))

## [3.0.0](https://github.com/StackOneHQ/agent-plugins/compare/stackone-agent-plugins-v2.5.0...stackone-agent-plugins-v3.0.0) (2026-05-27)


### ⚠ BREAKING CHANGES

* **defender:** defender-feedback.mjs is removed. Any external caller (none in the released plugin; this was internal-testing only) must adapt.

### Features

* add stackone-defender skill ([#7](https://github.com/StackOneHQ/agent-plugins/issues/7)) ([26b432e](https://github.com/StackOneHQ/agent-plugins/commit/26b432ebdb71c32136d3c28905f476fa764872a0))
* **defender:** daemon-backed scanner, balanced multihead, FP-feedback loop (v2.4.1) ([#16](https://github.com/StackOneHQ/agent-plugins/issues/16)) ([3c0bf33](https://github.com/StackOneHQ/agent-plugins/commit/3c0bf33adb1a6226c5b308c057159908fa3fb021))
* **defender:** remove FP-collector loop, switch skill to silent-review ([#24](https://github.com/StackOneHQ/agent-plugins/issues/24)) ([916dc85](https://github.com/StackOneHQ/agent-plugins/commit/916dc85d2421d702104f2e0b3ea7835c1ec17a24))
* **ENG-12256:** add unified connector building skill ([#4](https://github.com/StackOneHQ/agent-plugins/issues/4)) ([6e46e20](https://github.com/StackOneHQ/agent-plugins/commit/6e46e209f5c795252330f5942c79c5e017cbf1a8))
* **ENG-70:** enable SFE preprocessing to reduce Bash false positives ([#15](https://github.com/StackOneHQ/agent-plugins/issues/15)) ([b65ca10](https://github.com/StackOneHQ/agent-plugins/commit/b65ca10bcb833959d07662296e8fea29d43a6a2d))
* extend PostToolUse matcher to cover MCP tools ([#11](https://github.com/StackOneHQ/agent-plugins/issues/11)) ([9511434](https://github.com/StackOneHQ/agent-plugins/commit/951143424615a8cf67d29d0199e52b5ca809ad8f))
* validate marketplace.json using claude plugin validate ([0962f31](https://github.com/StackOneHQ/agent-plugins/commit/0962f31e343f594a852468d699ba04c85b991515))
* validate marketplace.json using Zod schema mirroring Claude Code ([5903c38](https://github.com/StackOneHQ/agent-plugins/commit/5903c383d984cf59433a3a9e4a546a48928010dd))


### Bug Fixes

* extract tool_response.result for WebFetch/WebSearch ([#10](https://github.com/StackOneHQ/agent-plugins/issues/10)) ([87f2327](https://github.com/StackOneHQ/agent-plugins/commit/87f23277c91058d621d8e8417f184973a922e8d7))
* replace invalid "." source with github object in marketplace.json ([9123204](https://github.com/StackOneHQ/agent-plugins/commit/9123204800260f6b97e1165f98061e53a12ae96f))
* replace invalid source in marketplace.json ([706fc53](https://github.com/StackOneHQ/agent-plugins/commit/706fc530307117e8ba643dfaca337ab49da75879))
* self-install Defender deps and load from plugin root ([#8](https://github.com/StackOneHQ/agent-plugins/issues/8)) ([553f68b](https://github.com/StackOneHQ/agent-plugins/commit/553f68bdb94e3ab8efaea61e991dfb4c12fcb9e1))
* self-install deps from script location, remove SessionStart hook ([#13](https://github.com/StackOneHQ/agent-plugins/issues/13)) ([31c6f5a](https://github.com/StackOneHQ/agent-plugins/commit/31c6f5ac4ad6f943680f9c0c5346990bdc417316))
* use claude plugin validate instead of custom Zod script ([2361c23](https://github.com/StackOneHQ/agent-plugins/commit/2361c23cc2a908025e03a0f578be5e26314685d9))

## [2.5.0](https://github.com/StackOneHQ/agent-plugins-marketplace/compare/stackone-v2.4.0...stackone-v2.5.0) (2026-05-15)


### Features

* **defender:** daemon-backed scanner, balanced multihead, FP-feedback loop (v2.4.1) ([#16](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/16)) ([3c0bf33](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/3c0bf33adb1a6226c5b308c057159908fa3fb021))

## [2.4.0](https://github.com/StackOneHQ/agent-plugins-marketplace/compare/stackone-v2.3.1...stackone-v2.4.0) (2026-05-05)


### Features

* add stackone-defender skill ([#7](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/7)) ([26b432e](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/26b432ebdb71c32136d3c28905f476fa764872a0))
* **ENG-12256:** add unified connector building skill ([#4](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/4)) ([6e46e20](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/6e46e209f5c795252330f5942c79c5e017cbf1a8))
* **ENG-70:** enable SFE preprocessing to reduce Bash false positives ([#15](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/15)) ([b65ca10](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/b65ca10bcb833959d07662296e8fea29d43a6a2d))
* extend PostToolUse matcher to cover MCP tools ([#11](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/11)) ([9511434](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/951143424615a8cf67d29d0199e52b5ca809ad8f))
* validate marketplace.json using claude plugin validate ([0962f31](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/0962f31e343f594a852468d699ba04c85b991515))
* validate marketplace.json using Zod schema mirroring Claude Code ([5903c38](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/5903c383d984cf59433a3a9e4a546a48928010dd))


### Bug Fixes

* extract tool_response.result for WebFetch/WebSearch ([#10](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/10)) ([87f2327](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/87f23277c91058d621d8e8417f184973a922e8d7))
* replace invalid "." source with github object in marketplace.json ([9123204](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/9123204800260f6b97e1165f98061e53a12ae96f))
* replace invalid source in marketplace.json ([706fc53](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/706fc530307117e8ba643dfaca337ab49da75879))
* self-install Defender deps and load from plugin root ([#8](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/8)) ([553f68b](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/553f68bdb94e3ab8efaea61e991dfb4c12fcb9e1))
* self-install deps from script location, remove SessionStart hook ([#13](https://github.com/StackOneHQ/agent-plugins-marketplace/issues/13)) ([31c6f5a](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/31c6f5ac4ad6f943680f9c0c5346990bdc417316))
* use claude plugin validate instead of custom Zod script ([2361c23](https://github.com/StackOneHQ/agent-plugins-marketplace/commit/2361c23cc2a908025e03a0f578be5e26314685d9))

## Changelog
