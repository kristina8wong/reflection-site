const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'icon.svg')
const sizes = [192, 512]

async function generate() {
  const svg = fs.readFileSync(svgPath)
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
