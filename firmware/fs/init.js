load('api_config.js');
load('api_gpio.js');
load('api_sys.js');
load('api_rpc.js');
load('api_timer.js');
load('api_dht.js');
load('api_adc.js');
load('api_mqtt.js');
load('api_gcp.js');


// ---- VARIABLES ---- 
let deviceName = Cfg.get('device.id');
let topicData = '/devices/' + deviceName + '/events';           // Topic IoTCore for events
let topicState = '/devices/' + deviceName + '/state';            // Topic IoTCore for states
let tState;


// ---- PORTS IN/OUTS---- 
let dhtPin = Cfg.get('app.dht');
let gasPin = Cfg.get('app.gas');
let ledPin = Cfg.get('app.led');

// ---- CONFIG FEATURES ---- 
if (ADC.enable(gasPin)) {                                   // ADC Enable
  print('ADC Status: Enable');
}
else {
  print('ADC Status: Not enable');
}

GPIO.set_mode(ledPin, GPIO.MODE_OUTPUT)                     // GPIO for led has output
let dht = DHT.create(dhtPin, DHT.AM2302);                   // Create object for DHT sensor



// ---- FUNCTIONS -----
let getData = function () {
  return JSON.stringify({
    temp: dht.getTemp(),
    hum: dht.getHumidity(),
    gas: ADC.read(gasPin)
  });
};

 function publishData() {
  let ok = MQTT.pub(topicData, getData());
  if (ok) {
    print('Published DATA');
  } else {
    print('Error publishing DATA');
  }
}

function publishState() {
  let ok = MQTT.pub(topicState, tState);
  if (ok) {
    print('Published STATE');
  } else {
    print('Error publishing STATE');
  }
}



// ---- HANDLERS ---- 

// Read sensors
Timer.set(
  5000,
  true,
  function () {
    print('Data:', getData());
    GPIO.toggle(ledPin);
  },
  null
);

// Read State
Timer.set(
  60 * 1000,
  true,
  function () {
    RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function (resp, ud) {
      tState =  JSON.stringify(resp);
    }, null);
    print('State:', tState);
  },
  null
);

//Publish Data
Timer.set(
  60 * 1000,
  true,
  function () {
    if (GCP.isConnected()) {
      publishData();
    }
    else print('NO CONECTADO')
  },
  null
);

//Publish State
Timer.set(
  3600 * 1000,
  true,
  function () {
    if (GCP.isConnected()) {
      publishState();
    }
  },
  null
);
