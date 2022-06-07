const { createServer } = require('http')
const { createApp, useBody, appendHeader, sendStream } = require('h3')
const { exec } = require('child_process')
const { sanitizeName, sanitizePath } = require('./sanitize')

const fs = require('fs')
const path = require('path')

const template = './cert-2022.png'

const generate = (text, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      exec(
        `convert ${template} -gravity South -pointsize 160 -annotate +0+980 "${text}" ${filepath}`,
        (error, stdout, stderr) => {
          console.log(stdout)
          console.error(stderr)
          if (error !== null) {
            console.log(`exec error: ${error}`)
          }
          resolve({ success: true, message: 'done' })
        }
      )
    } catch (error) {
      reject({ success: false, error })
    }
  })
}

const consume = async (name, filename, res) => {
  const filepath = path.join(__dirname, 'static', filename + '.png')
  appendHeader(res, 'Content-Type', 'application/octet-stream')

  if (fs.existsSync(filepath)) {
    console.log(`send exisitng file for ${name}`)
    return sendStream(res, fs.createReadStream(filepath))
  }

  console.log(`generate for ${name}`)
  await generate(name, filepath)
  return sendStream(res, fs.createReadStream(filepath))
}

const app = createApp()
app.use('/', async ({ req, res }) => {
  const { name } = await useBody(req)
  if (name == undefined) return { success: false, error: 'name required' }

  return consume(sanitizeName(name), sanitizePath(name), res)
})

createServer(app).listen(process.env.PORT || 3000)
