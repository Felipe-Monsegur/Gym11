const sharp = require('sharp')
const fs = require('fs')

async function main() {
  const logo = fs.readFileSync('public/logo.svg')
  await sharp(logo).resize(512, 512).png().toFile('public/img/icons/icon-512.png')
  await sharp(logo).resize(192, 192).png().toFile('public/img/icons/icon-192.png')
  await sharp(logo).resize(180, 180).png().toFile('public/img/icons/apple-touch-icon.png')
  await sharp(logo).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(logo).resize(32, 32).png().toFile('public/favicon-32.png')

  const transparent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(67 51.25) scale(15.75)">
    <rect x="2" y="6" width="20" height="14" rx="2"/>
    <path d="M2 10h20"/>
    <path d="M16 14h.01"/>
  </g>
</svg>`
  await sharp(Buffer.from(transparent)).png().toFile('public/img/icons/walletW.png')

  console.log('icons generated')
  console.log('legacy:', fs.readdirSync('public/img/icons/legacy'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
