# Admin-Controlled Anonymous Feedback Design

## Summary

This document defines the v1 product direction for the app as a verified internal feedback system with anonymous participation and organizer-controlled visibility.

The product is not a general public polling tool and not yet a full governance engine. In v1, the app should help an organizer collect honest anonymous messages and controlled votes from approved participants while deciding who can participate, who can see results, and who can review messages.

## Product Intent

The core problem is that people often vote or speak in ways that protect relationships, status, or hierarchy instead of telling the truth. The app should reduce that pressure without removing organizer control.

The intended model is:

- participants verify identity using an organizer-approved method
- verified identity is hidden from peers during participation
- the organizer defines levels such as `public`, `executive`, or custom groups
- the organizer controls reach for both votes and messages
- messages are private by default and can be selectively revealed later
- votes can be restricted to specific levels and results can be shown to specific levels

## In Scope for V1

- organizer authentication
- organization creation
- organizer dashboard
- admin-defined hierarchy levels
- approved participant list
- organizer-defined verification method metadata
- verified participant access to one participant room
- anonymous message submission
- anonymous voting
- per-item audience and visibility rules
- organizer review of all messages
- organizer review of vote performance
- organizer-controlled message reveal
- organizer-controlled result visibility

## Out of Scope for V1

- elections
- office or tenure lifecycle
- promotion and demotion rules
- no-confidence workflows
- automatic WhatsApp or social login integration
- advanced analytics
- moderation automation
- multi-organization super admin

## Primary Users

### Organizer

The organizer is the founder, leader, or trusted admin who creates the organization, defines levels, registers participants, and configures visibility rules.

The organizer needs to:

- create and manage an organization
- define levels and groups
- add verified participant identities
- choose which verification method is used
- create votes and message channels
- decide who can submit, who can vote, and who can see outputs
- review raw anonymous messages
- selectively reveal messages or summaries

### Participant

The participant is a pre-approved member of the organization who verifies identity before gaining access.

The participant needs to:

- verify using the method required by the organizer
- access only the activities they are eligible for
- submit messages anonymously
- vote anonymously
- view only the results or summaries allowed for their levels

## Experience Model

The product should be organized around two surfaces.

### Organizer Surface

This is a signed-in dashboard for management and review. It contains setup, access control, participation management, and oversight.

### Participant Surface

This is a single verified room. Participants should not need to understand the full governance structure. They should only see what they are currently allowed to do and what they are allowed to view.

This separation is the main simplification compared with the current app, which splits the experience across multiple demo-style pages and duplicated organization routes.

## Route Model

### Public

- `/`
  - landing page
  - clear actions for `Admin sign in` and `Enter room`

### Organizer

- `/admin`
  - organizer dashboard home

- `/admin/org/[code]`
  - organization control center

- `/admin/org/[code]/participants`
  - participant registry and assignment

- `/admin/org/[code]/levels`
  - level and group management

- `/admin/org/[code]/votes`
  - vote creation, visibility, and monitoring

- `/admin/org/[code]/messages`
  - message channel creation, review, and reveal controls

- `/admin/org/[code]/rules`
  - audience and visibility rules overview

### Participant

- `/room/[code]`
  - entry and verification

- `/room/[code]/space`
  - unified participant room after verification

## Information Architecture

### Landing Page

The landing page should stop behaving like a product demo and instead explain the real system:

- verified participation
- anonymous feedback
- organizer-controlled reach
- separate organizer and participant entry points

### Organizer Dashboard

The dashboard should explain the organization state at a glance:

- number of approved participants
- number of active levels
- active votes
- open message channels
- pending messages for review
- visible vote activity

The organizer dashboard navigation should be explicit rather than poetic. Use labels such as:

- Overview
- Participants
- Levels
- Votes
- Messages
- Rules

Avoid unclear labels such as `Whisper Room` for admin navigation.

### Participant Room

The participant room should be a single workspace with conditional sections:

- `Active votes`
- `Anonymous messages`
- `Visible results`
- `What you can access`

The participant room should never expose admin-only controls or the full hierarchy model.

## Access and Identity Model

### Verified but Anonymous

Participants are not anonymous to the system. They are anonymous to other participants and to non-authorized viewers inside the product.

The organizer chooses the verification basis for the organization. Examples include:

- phone number
- email address
- social account handle
- custom identifier

V1 should support storing organizer-defined verification method metadata and matching participant records against that method. The UX should be written so the verification method can change by organization without rewriting the participant experience.

### Approved Participant Registry

Only identities pre-approved by the organizer may participate.

Each participant record needs:

- identifier type
- identifier value
- display label for admin use
- membership status
- assigned levels
- timestamps

## Levels and Audience Model

### Levels

The organizer creates levels such as:

- public
- executive
- regional council
- chapter leads

V1 should allow flexible assignment so a participant can be attached to one or more levels. This matches the requirement that the structure be adjustable.

### Audience Rules

Every vote or message channel should carry explicit audience rules.

For votes:

- who can vote
- who can view live results
- who can view final results

For messages:

- who can submit
- who can review raw messages
- who can view revealed messages or summaries

## Vote Model

Votes are the public signal only when the organizer allows them to be public for the chosen audience.

Each vote should support:

- title
- description
- tag or category
- eligibility levels
- result visibility levels
- status such as draft, active, closed

Participant behavior:

- a participant sees only votes available to their verified levels
- vote interaction should feel immediate and simple
- if result visibility is allowed, the participant sees live or final outcome based on the vote settings

Organizer behavior:

- create and publish votes
- choose eligible levels
- choose result visibility
- monitor participation totals

## Message Model

Messages are a private input stream by default.

Each message channel should support:

- prompt or purpose
- eligibility levels
- reviewers
- reveal audience
- status such as draft, open, closed

Participant behavior:

- a participant sees only message channels open to their verified levels
- a participant submits anonymously
- a participant should receive a clear confirmation after submission

Organizer behavior:

- review all raw messages
- optionally reveal selected messages
- optionally reveal grouped summaries
- choose which audience can see revealed outputs

The participant room should not show a raw message wall unless the organizer has explicitly allowed that for a channel or summary output.

## Core Flows

### Organizer Setup Flow

1. Sign in
2. Create organization
3. Define levels
4. Add approved participants
5. Choose verification method
6. Create votes or message channels
7. Configure eligibility and visibility
8. Share participant room link

### Participant Access Flow

1. Open room link
2. Verify using the required identity method
3. Enter unified room
4. View allowed activities
5. Submit anonymous message or cast vote
6. View allowed summaries or results

### Organizer Review Flow

1. Open dashboard
2. Review active votes and message intake
3. Inspect raw messages
4. Reveal selected messages or summaries if needed
5. Adjust visibility rules for future items

## UX Principles

- use plain labels instead of themed names when clarity matters
- keep participant screens minimal and action-oriented
- make eligibility obvious without exposing private policy details
- preserve a strong sense of anonymity during participation
- separate admin control from participant action
- support mobile-first interaction because many participants may verify and respond on phones
- avoid showing empty decorative panels that do not help action or understanding

## Accessibility Requirements

- all flows must be keyboard accessible
- form controls need visible labels, not placeholder-only labeling
- contrast must remain accessible across dark surfaces
- status feedback must be readable by assistive technology
- participant verification and submission flows must not rely on color alone
- action labels should describe the result, for example `Submit anonymous message`

## Data Model Additions

The current schema is too shallow for the target product. V1 needs additional entities or equivalent structures for:

- participant identities
- verification configuration
- hierarchy levels
- participant-to-level assignments
- vote audience rules
- vote result visibility rules
- message channel definitions
- message reviewer permissions
- message reveal permissions

At a minimum, the data model must clearly separate:

- organization ownership
- organizer membership
- participant identity
- participant eligibility
- participant activity
- revealed output

## Codebase Reshaping

The current app duplicates vote and message experiences between generic routes and organization routes. That makes the product harder to understand and maintain.

The implementation should move toward:

- a clear admin route tree
- a clear participant route tree
- shared server modules for organizations, participants, levels, votes, messages, and rules
- removal or de-emphasis of demo-only public vote and message pages
- UI text that explains the system instead of marketing around it

The current `src/app/org/*` routes can serve as transitional material, but they should not remain the final information architecture for v1.

## Risks and Mitigations

### Risk: scope expansion into governance

The requirements naturally push toward elections, offices, and tenure rules.

Mitigation:

- keep v1 focused on anonymous feedback and controlled voting
- leave governance workflows for a later phase

### Risk: participant confusion around visibility

Participants may not know why they can see some items and not others.

Mitigation:

- show simple eligibility messaging such as `Available to your group`
- avoid exposing complex policy logic

### Risk: weak trust in anonymity

If the product does not explain the difference between verification and peer anonymity, users may hesitate to participate honestly.

Mitigation:

- clearly explain that identity is verified for access control
- clearly explain that submissions and votes are anonymous to peers

## Success Criteria

V1 is successful if:

- an organizer can create an organization and configure levels without confusion
- only approved participants can access the room
- participants can quickly understand what actions are available to them
- participants feel safe enough to submit honest messages and votes
- organizers can review all collected messages
- organizers can control visibility of results and revealed content without manual workarounds

## Recommendation

Build v1 as an admin-controlled anonymous feedback system with:

- one organizer dashboard
- one verified participant room
- flexible levels
- approved identity-based access
- controlled vote visibility
- private-by-default messages

This direction matches the user intent and simplifies the current app into a product that is easier to understand, easier to use, and structurally ready for later governance features.
