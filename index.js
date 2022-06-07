const { createServer } = require('http')
const {
  createApp,
  appendHeader,
  sendStream,
  sendRedirect,
  useQuery,
} = require('h3')
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
  appendHeader(
    res,
    'Content-Disposition',
    'attachment; filename="certificate-bikeday-2022.png"'
  )

  if (fs.existsSync(filepath)) {
    console.log(`send exisitng file for ${name}`)
    return sendStream(res, fs.createReadStream(filepath))
  }

  console.log(`generate for ${name}`)
  await generate(name, filepath)
  return sendStream(res, fs.createReadStream(filepath))
}

const app = createApp()
app.use('/2022', async ({ req, res }) => {
  const { name } = useQuery(req)
  if (name == undefined) return { success: false, error: 'name required' }

  return consume(sanitizeName(name), sanitizePath(name), res)
})

app.use('/', (event) => sendRedirect(event, 'https://bikeday.me'))

createServer(app).listen(process.env.PORT || 3000)
