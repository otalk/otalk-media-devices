var State = require('ampersand-state');
var Collection = require('ampersand-collection');
var FilteredCollection = require('ampersand-filtered-subcollection');


var getSources = function (cb) {
    if (window.navigator.mediaDevices && window.navigator.mediaDevices.enumerateDevices) {
        return window.navigator.mediaDevices.enumerateDevices().then(cb);
    }
    if (window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
        return window.MediaStreamTrack.getSources(cb);
    }
};


var DeviceInfo = State.extend({
    idAttribute: 'deviceId',

    props: {
        label: 'string',
        groupId: 'string',
        deviceId: {
            type: 'string',
            required: true
        },
        kind: {
            type: 'string',
            values: [
                'audioinput',
                'audiooutput',
                'videoinput'
            ]
        }
    },

    derived: {
        name: {
            deps: [ 'kind', 'label' ],
            fn: function () {
                if (this.label) {
                    return this.label;
                }

                if (this.kind === 'videoinput') {
                    return 'Generic Camera';
                }

                if (this.kind === 'audioinput') {
                    return 'Generic Microphone';
                }

                if (this.kind === 'audiooutput') {
                    return 'Generic Speaker';
                }
            }
        },

        isCamera: {
            deps: [ 'kind' ],
            fn: function () {
                return this.kind === 'videoinput';
            }
        },

        isMicrophone: {
            deps: [ 'kind' ],
            fn: function () {
                return this.kind === 'audioinput';
            }
        },

        isSpeaker: {
            deps: [ 'kind' ],
            fn: function () {
                return this.kind === 'audiooutput';
            }
        }
    },

    parse: function (attrs) {
        var data = {
            deviceId: attrs.deviceId || attrs.id,
            groupId: attrs.groupId,
            label: attrs.label,
            kind: attrs.kind
        };

        if (attrs.kind === 'audio') {
            data.kind = 'audioinput';
        } else if (attrs.kind === 'video') {
            data.kind = 'videoinput';
        }

        return data;
    }
});



var DeviceManager = State.extend({
    props: {
        knownDevices: {
            type: 'boolean',
            required: true,
            default: false
        },

        cameras: 'collection',
        microphones: 'collection',
        speakers: 'collection',

        preferredCamera: 'string',
        preferredMicrophone: 'string',
        preferredSpeaker: 'string',

        cameraAccess: {
            type: 'string',
            required: true,
            default: 'unknown',
            values: [
                'unknown',
                'granted',
                'denied',
                'pending',
                'dismissed'
            ]
        },
        microphoneAccess: {
            type: 'string',
            required: true,
            default: 'unknown',
            values: [
                'unknown',
                'granted',
                'denied',
                'pending',
                'dismissed'
            ]
        }
    },

    derived: {
        cameraPermissionGranted: {
            deps: [ 'cameraAccess' ],
            fn: function () {
                return this.cameraAccess === 'granted';
            }
        },
        microphonePermissionGranted: {
            deps: [ 'microphoneAccess' ],
            fn: function () {
                return this.microphoneAccess === 'granted';
            }
        },
        cameraPermissionDenied: {
            deps: [ 'cameraAccess' ],
            fn: function () {
                return this.cameraAccess === 'denied';
            }
        },
        microphonePermissionDenied: {
            deps: [ 'microphoneAccess' ],
            fn: function () {
                return this.microphoneAccess === 'denied';
            }
        },
        cameraPermissionPending: {
            deps: [ 'cameraAccess' ],
            fn: function () {
                return (this.cameraAccess === 'pending') || this.cameraPermissionDismissed;
            }
        },
        microphonePermissionPending: {
            deps: [ 'microphoneAccess' ],
            fn: function () {
                return (this.microphoneAccess === 'pending') || this.microphonePermissionDismissed;
            }
        },
        cameraPermissionDismissed: {
            deps: [ 'cameraAccess' ],
            fn: function () {
                return this.cameraAccess === 'dismissed';
            }
        },
        microphonePermissionDismissed: {
            deps: [ 'microphoneAccess' ],
            fn: function () {
                return this.microphoneAccess === 'dismissed';
            }
        },
    },

    collections: {
        devices: Collection.extend({
            model: DeviceInfo
        })
    },

    initialize: function () {
        var self = this;

        self.cameras = new FilteredCollection(self.devices, {
            where: { isCamera: true }
        });

        self.microphones = new FilteredCollection(self.devices, {
            where: { isMicrophone: true }
        });

        self.speakers = new FilteredCollection(self.devices, {
            where: { isSpeaker: true }
        });


        // Initial generic data
        self.devices.set([
            { deviceId: 'default-audio', kind: 'audioinput' },
            { deviceId: 'default-video', kind: 'videoinput' }
        ]);

        self.refresh();

        if (window.navigator.mediaDevices) {
            window.navigator.mediaDevices.addEventListener('devicechange', function () {
                self.refresh();
            });
        }

        // Refresh the device list once we have access permission so we can get the device names
        self.on('change:cameraPermissionGranted change:microphonePermissionGranted', function () {
            self.refresh();
        });
    },

    refresh: function () {
        var self = this;

        getSources(function (sources) {
            if (!sources || !sources.length) {
                self.knownDevices = false;
                return;
            }

            self.devices.set(sources, { parse: true, merge: true });
            self.knownDevices = true;
        });
    },

    requestCameraAccess: function () {
        var self = this;

        var startingState = self.cameraAccess;

        if (startingState === 'dismissed' || startingState === 'pending') {
            startingState = 'unknown';
        }

        if (startingState === 'unknown') {
            self.cameraAccess = 'pending';
        }

        return function (result) {
            switch (result) {
            case 'granted':
                self.cameraAccess = 'granted';
                break;
            case 'denied':
                self.cameraAccess = 'denied';
                break;
            case 'dismissed':
                if (self.cameraAccess === 'pending') {
                    self.cameraAccess = 'dismissed';
                }
                break;
            case 'error':
                self.cameraAccess = startingState;
                break;
            }
        };
    },

    requestMicrophoneAccess: function () {
        var self = this;
        var startingState = self.microphoneAccess;

        if (startingState === 'dismissed' || startingState === 'pending') {
            startingState = 'unknown';
        }

        if (startingState === 'unknown') {
            self.microphoneAccess = 'pending';
        }

        return function (result) {
            switch (result) {
            case 'granted':
                self.microphoneAccess = 'granted';
                break;
            case 'denied':
                self.microphoneAccess = 'denied';
                break;
            case 'dismissed':
                if (self.microphoneAccess === 'pending') {
                    self.microphoneAccess = 'dismissed';
                }
                break;
            case 'error':
                self.microphoneAccess = startingState;
                break;
            }
        };
    },

    getCameraByLabel: function (label) {
        var cameras = this.cameras.filter(function (camera) {
            return camera.label === label;
        });
        if (!cameras.length) {
            return null;
        }
        return cameras[0];
    },

    getMicrophoneByLabel: function (label) {
        var microphones = this.microphones.filter(function (microphone) {
            return microphone.label === label;
        });
        if (!microphones.length) {
            return null;
        }
        return microphones[0];
    }
});


module.exports = DeviceManager;
