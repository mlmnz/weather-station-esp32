const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const dataset = bigquery.dataset('weatherstation');
const table = dataset.table('telemetry');

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.data2bq = (event, context) => {
    let isDebug = false;

    // Get event data, and organize it to send to bq
    const dataMessage = event.data;
    const timestamp = context.timestamp;
    const deviceId = event.attributes.deviceId;

    let datajson = JSON.parse(Buffer.from(dataMessage, 'base64')); // Decoding message and parsing 
    Object.assign(datajson, { "timestamp": timestamp }, { "deviceId": deviceId }); // Push data missing to obj


    //Send to bigquery
    table.insert(datajson)
        .then((datas) => {
            const apiResponse = datas[0];
            if(isDebug){
                console.log("Datos insertado correctamente")
            }
        })
        .catch((err) => {
            // An API error or partial failure occurred.
            console.error("Ocurrio un error al insertar los datos")
            if (err.name === 'PartialFailureError') {
                console.error("Se insertaron algunos valores pero hay errores")
            }
        });


    // Debugs
    if (isDebug) {
        console.log(`Hora de recibido: ${timestamp.toString()}`);
        console.log(JSON.stringify(datajson));
    }
};
