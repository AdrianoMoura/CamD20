let video
let diceSound

let gfx3D
let gfx2D

let currentRoll = null
let rolling = false
let rollStartTime = 0
let rollDuration = 2000
let fadeStartTime = 0

let rollState = {
  angleX: 0,
  angleY: 0,
  startAngleX: 0,
  startAngleY: 0,
  targetAngleX: 0,
  targetAngleY: 0
}

let icoVertices = []
let icoFaces = []

const d20FaceRotations = [
  [-0.6155, -0.7854], [-1.2059, -0.0], [-1.2059, 3.1416], [-0.6155, -2.3562], [-0.3649, -1.5708],
  [-0.6155, 0.7854], [-0.0, -0.3649], [0.3649, -1.5708], [-0.0, -2.7767], [-0.6155, 2.3562],
  [0.6155, 0.7854], [1.2059, 0.0], [1.2059, -3.1416], [0.6155, 2.3562], [0.3649, 1.5708],
  [0.0, 0.3649], [0.6155, -0.7854], [0.6155, -2.3562], [-0.0, 2.7767], [-0.3649, 1.5708]
]

function preload () {
  diceSound = loadSound('dice.mp3')
}

function setup () {
  createCanvas(1280, 768)
  gfx3D = createGraphics(1280, 768, WEBGL)
  gfx2D = createGraphics(1280, 768)

  gfx2D.textFont('monospace')
  gfx2D.textSize(64)
  gfx2D.textAlign(CENTER, CENTER)
  gfx2D.clear()

  video = createCapture(VIDEO)
  video.hide()
  createIcosahedron()
}

function draw () {
  updateRoll()
  render3DDice()
  renderHUD()

  image(gfx3D, 300, 0)
  image(gfx2D, 0, 0)
}

function updateRoll () {
  if (!rolling) return

  let t = constrain((millis() - rollStartTime) / rollDuration, 0, 1)
  rollState.angleX = lerp(rollState.startAngleX, rollState.targetAngleX, easeOutQuad(t))
  rollState.angleY = lerp(rollState.startAngleY, rollState.targetAngleY, easeOutQuad(t))

  if (t >= 1) {
    rolling = false
    fadeStartTime = millis()
    currentRoll = rollD20UsingWebcam()
  }
}

function render3DDice () {
  gfx3D.clear()
  gfx3D.push()
  gfx3D.background(17)
  gfx3D.scale(150)
  gfx3D.rotateX(rollState.angleX)
  gfx3D.rotateY(rollState.angleY)
  gfx3D.stroke(255)
  gfx3D.directionalLight(255, 255, 255, 0.5, 0.5, -1)
  gfx3D.ambientLight(100)

  for (let face of icoFaces) {
    gfx3D.fill(0)
    gfx3D.beginShape(TRIANGLES)
    for (let j of face) gfx3D.vertex(...icoVertices[j])
    gfx3D.endShape(CLOSE)
  }

  gfx3D.pop()
}

function renderHUD () {
  gfx2D.clear()
  drawWebcam()

  if (!rolling && currentRoll !== null) {
    let alpha = constrain(map(millis() - fadeStartTime, 0, 1000, 0, 255), 0, 255)
    gfx2D.fill(255, alpha)
    gfx2D.text(
      String(currentRoll).padStart(2, '0'),
      gfx2D.width / 2 + 300,
      gfx2D.height / 2
    )
  }
}

function drawWebcam () {
  const maxVideoWidth = 640
  const videoAspect = video.width / video.height
  const videoDisplayWidth = maxVideoWidth
  const videoDisplayHeight = videoDisplayWidth / videoAspect

  gfx2D.image(
    video,
    20,
    height / 2 - videoDisplayHeight / 2,
    videoDisplayWidth,
    videoDisplayHeight
  )
}

function mousePressed () {
  if (!rolling) startRoll()
}

function startRoll () {
  rolling = true
  rollStartTime = millis()
  currentRoll = null

  rollState.startAngleX = 0
  rollState.startAngleY = 0

  const faceIndex = floor(random(20))
  const [faceX, faceY] = d20FaceRotations[faceIndex]
  const extraSpins = 4
  rollState.targetAngleX = faceX + TWO_PI * extraSpins
  rollState.targetAngleY = faceY + TWO_PI * extraSpins

  if (diceSound && !diceSound.isPlaying()) diceSound.play()
}

function rollD20UsingWebcam () {
  video.loadPixels()
  if (video.pixels.length === 0) return floor(random(1, 21))

  let sum = 0
  for (let i = 0; i < video.pixels.length; i += 4) {
    sum += video.pixels[i] + video.pixels[i + 1] + video.pixels[i + 2]
  }

  return 1 + floor(sum % 20)
}

function createIcosahedron () {
  const t = (1 + Math.sqrt(5)) / 2
  icoVertices = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ].map(v => {
    const mag = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
    return [v[0] / mag, v[1] / mag, v[2] / mag]
  })

  icoFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ]
}

function easeOutQuad (t) {
  return t * (2 - t)
}
