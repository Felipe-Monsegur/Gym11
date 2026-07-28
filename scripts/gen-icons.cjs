const sharp = require('sharp')
const fs = require('fs')

async function main() {
  const logo = fs.readFileSync('public/logo.svg')
  await sharp(logo).resize(512, 512).png().toFile('public/img/icons/icon-512.png')
  await sharp(logo).resize(192, 192).png().toFile('public/img/icons/icon-192.png')
  await sharp(logo).resize(180, 180).png().toFile('public/img/icons/apple-touch-icon.png')
  await sharp(logo).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(logo).resize(32, 32).png().toFile('public/favicon-32.png')

  // Variante transparente (solo trazo Lucide dumbbell)
  const transparent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(56 56) scale(16.666)">
    <path d="M14.4 14.4 9.6 9.6" />
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
    <path d="m21.5 21.5-1.4-1.4" />
    <path d="M3.9 3.9 2.5 2.5" />
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
  </g>
</svg>`
  await sharp(Buffer.from(transparent)).png().toFile('public/img/icons/walletW.png')

  console.log('icons generated')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
