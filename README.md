# otalk-media-devices

A module for tracking a user's media devices.

## Properties

- `knownSources` - `{Boolean}`
- `devices` - `{Collection}`
- `cameras` - `{Collection}`
- `microphones` - `{Collection}`
- `speakers` - `{Collection}`
- `preferredCamera` - `{String}`
- `preferredMicrophone` - `{String}`
- `preferredSpeaker` - `{String}`
- `cameraPermissionGranted` - `{Boolean}`
- `cameraPermissionDenied` - `{Boolean}`
- `cameraPermissionPending` - `{Boolean}`
- `cameraPermissionDismissed` - `{Boolean}`
- `microphonePermissionGranted` - `{Boolean}`
- `microphonePermissionDenied` - `{Boolean}`
- `microphonePermissionPending` - `{Boolean}`
- `microphonePermissionDismissed` - `{Boolean}`

## Methods

- `refresh()`
- `requestCameraAccess()`
- `requestMicrophoneAccess()`
- `getCameraByLabel(label)`
- `getMicrophoneByLabel(label)`

## Device Properties

- `deviceId` - `{String}`
- `groupId` - `{String}`
- `label` - `{String}`
- `kind` - `{String}`
- `name` - `{String}`
- `isCamera` - `{Boolean}`
- `isMicrophone` - `{Boolean}`
- `isSpeaker` - `{Boolean}`
