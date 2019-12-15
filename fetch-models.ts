const request = require('request'), 
    fs = require('fs'), 
    _cliProgress = require('cli-progress'),
    targz = require('node-tar.gz')

const download = (url: string, filename: string, callback: any) => {

    const progressBar = new _cliProgress.SingleBar({
        format: '{bar} {percentage}%'
    }, _cliProgress.Presets.shades_classic)

    const file = fs.createWriteStream(filename)
    let receivedBytes = 0
    

    request.get(url)
    .on('response', (response) => {
        if (response.statusCode !== 200) {
            return callback('Response status was ' + response.statusCode)
        }

        const totalBytes = response.headers['content-length']
        progressBar.start(totalBytes, 0)
    })
    .on('data', (chunk) => {
        receivedBytes += chunk.length
        progressBar.update(receivedBytes)
    })
    .pipe(file)
    .on('error', (err) => {
        fs.unlink(filename)
        progressBar.stop()
        return callback(err.message)
    })

    file.on('finish', () => {
        progressBar.stop()
        file.close(callback)
    })

    file.on('error', (err) => {
        fs.unlink(filename) 
        progressBar.stop()
        return callback(err.message)
    })
}


const fileUrl = `https://github.com/mozilla/DeepSpeech/releases/download/v0.6.0/deepspeech-0.6.0-models.tar.gz`
const fileName = 'packed-models.tar.gz'
const unpackedFolder = 'models'

if (!fs.existsSync(`./${unpackedFolder}`)) {
  download(fileUrl, fileName, () => {
    // unpack
    console.log('finished downloading, will now unpack')
    targz()
      .extract(fileName, unpackedFolder)
      .then(function(){
        console.log('Successfully unpacked and created "models" folder.');
      })
      .catch(function(err){
        console.log('Unpacking failed ', err.stack)
        process.exit(1)
      })
  })
} else {
  console.log('models folder already exists, skipping...')
}