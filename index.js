var http = require('http'),
    fs = require('fs'),
    connect = require('connect'),
    serveStatic = require('serve-static'),
    WebSocketServer = require('ws');

var PocketsGenerator = function() {
    this.PORT = 8090;
    this.DEVICES_COUNT = 20000; //количество устройств
    this.PERIOD_LOCATION = 500; //частота генерации пакетов с локацией
    this.PERIOD_STATUS = 1000; //частота генерации пакетов со статусом
    this.STEP = 0.005; //величина изменения расстояния
    this.LAT = 25; //широта для генерации координат пакетов
    this.LON = 82; //долгота для генерации координат пакетов
    this.interval = null;
    this.firstSend = false;
    this.devices = [];
    this.pockets = {};
    this.startWS();
    this.startServer();
};

PocketsGenerator.prototype = {

    startWS: function() {
        this.wsServer = new WebSocketServer.Server({ port: this.PORT + 1 });
        this.setListeners();
    },

    startServer: function() {
        var that = this;
        this.server = connect().use(serveStatic(__dirname)).listen(that.PORT, function() {
            console.log('Server running on ' + that.PORT + '...');
        });
    },

    createSocket: function() {
        var that = this;
        this.socket = io.listen(this.server);
        this.socket.on('connection', function(client) {
            console.log('start connection');
            that.client = client;
            that.startApp();
        });
    },

    startApp: function() {
        this.setTimer0 = null;
        this.setTimer1 = null;
        this.setListeners();
    },

    setListeners: function() {
        console.log('set listeners')
        var that = this;

        this.wsServer.on('connection', function(ws) {

            var id = Math.random();
            that.client = ws;
            console.log("new connection " + id);

            ws.on('message', function(message) {
                    that.getMessage(message);
            })
            .on('close', function() {
                console.log('connection closed ' + id);
                delete that['client'];
            });

        });
    },

    getMessage: function(_message) {
        var that = this,
            message = JSON.parse(_message),
            msgName = message.name;console.log('new message ' + msgName);
        switch(msgName){
            case 'start':
                that.createDevices();
                that.createPockets();
                console.log('Start pockets generation');

                that.setTimer0 = setInterval(function(id) {
                    var types = ['location'];
                    that.updatePockets(types);
                    that.sendPockets(types);
                }, that.PERIOD_LOCATION, (0));

                if (that.setTimer1) clearInterval(that.setTimer1);

                that.setTimer1 = setInterval(function(id) {
                    types = ['status'];
                    that.updatePockets(types);
                    that.sendPockets(types);
                }, that.PERIOD_STATUS, (1));
            break;
        }
    },

    createDevices: function() {
        this.devices = [];
        for (var i = 0; i < this.DEVICES_COUNT; i++) {
            this.devices.push(this.getRndMac());
        }
    },

    createPockets: function() {
        this.pockets = {};
        this.pockets.location = [];
        this.pockets.status = [];
        for (var i = 0; i < this.devices.length; i++) {
            var currentDevice = this.devices[i],
                fractLon = this.LON + Number(Math.random().toFixed(3) * 10),
                fractLat = this.LAT + Number(Math.random().toFixed(3) * 10);
            var locationPocket = {
                mac: currentDevice,
                type: 'location',
                ts: Date.now(),
                location: {
                    lon: fractLon,
                    lat: fractLat,
                    alt: 0
                }
            };
            this.pockets.location.push(locationPocket);
            var statusPocket = {
                mac: currentDevice,
                type: 'status',
                ts: Date.now(),
                status: {
                    isOnline: true,
                    name: this.getRndName()
                }
            };
            this.pockets.status.push(statusPocket);
        }
    },

    updatePockets: function(types) {
        var that = this;
        this.pockets4send = {};
        types.forEach(function(type) {
            switch (type) {
                case 'location':
                    that.pockets4send.location = [];
                    that.pockets.location = that.pockets.location.map(function(pocket, i) {
                        var isOnline = that.pockets.status[i].status.isOnline;
                        if (isOnline) {
                            var willMoving = (Math.random() > 0.5) ? true : false;
                            if (willMoving) {
                                var currentLon = pocket.location.lon,
                                    currentLat = pocket.location.lat,
                                    direction = that.getRnd(0, 4),
                                    STEP = that.STEP;
                                switch (direction) {
                                    case 0:
                                        pocket.location.lon += STEP;
                                        pocket.location.lat += STEP;
                                        break;

                                    case 1:
                                        pocket.location.lon += STEP;
                                        pocket.location.lat += -STEP;
                                        break;

                                    case 2:
                                        pocket.location.lon += -STEP;
                                        pocket.location.lat += -STEP;
                                        break;

                                    case 4:
                                        pocket.location.lon += -STEP;
                                        pocket.location.lat += STEP;
                                        break;
                                }
                                if (currentLon != pocket.location.lon || currentLat != pocket.location.lat){
                                    that.pockets4send.location.push(pocket);
                                }
                            }
                        }
                        return pocket;
                    });
                    break;
                case 'status':
                    that.pockets4send.status = [];
                    that.pockets.status = that.pockets.status.map(function(pocket) {
                        var currentStatus = pocket.status.isOnline,
                            newStatus;
                        if (currentStatus) {
                            newStatus = (Math.random() > 0.1) ? true : false;
                        } else {
                            newStatus = (Math.random() > 0.2) ? false : true;
                        }
                        pocket.status.isOnline = newStatus;
                        if (currentStatus != newStatus){
                            that.pockets4send.status.push(pocket);
                        }
                        return pocket;
                    });
                    break;
            }
        });
    },

    sendPockets: function(types) {
        var that = this,
            pockets;
        if (this.firstSend) {
            pockets = this.pockets4send;
        } else {
            pockets = this.pockets;
            this.firstSend = true;
        }
        types.forEach(function(type) {
            console.log('send pockets: '+type);
            var message = {name: type, data: pockets[type]};
            console.log(message.data.length);

            if (that.client) {
                that.client.send(JSON.stringify(message));
            }
        });
    },

    getRnd: function(max, min) {
        max = max - 1;
        min = min + 1;
        return Math.floor(Math.random() * (max - min + 1)) + min
    },

    getRndMac: function() {
        var hexDigits = "0123456789ABCDEF",
            macAddress = "";
        for (var i = 0; i < 6; i++) {
            macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
            macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
            if (i != 5) macAddress += ":";
        }

        return macAddress;
    },

    getRndName: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

var generator = new PocketsGenerator();
