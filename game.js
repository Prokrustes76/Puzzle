let ctx, 
    game, 
    images = [],
    audios = [],
    offset, 
    clicked, 
    mouse  = {x: -100, y: -100}

function rect(x, y, w, h, col, fill) {
  fill ? ctx.fillStyle = col : ctx.strokeStyle = col
  fill ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h)
}

function write(text, x, y, size, col, align = 'center') {
  ctx.font = `${size}px Arial`
  ctx.textAlign = align
  ctx.fillStyle = col
  ctx.fillText(text, x, y)
} 

function mouseMove(e) {
  mouse.x = e.clientX - offset.left 
  mouse.y = e.clientY - offset.top 
}

function mouseDown(e) { 
  if (mouse.x >= 498 && mouse.x <= 648 && mouse.y >= 15 && mouse.y <= 65) {
    game.paused = !game.paused
    if (game.paused) audios[3].play()  
    else audios[3].pause()
  }

  else if (mouse.x < 50 || mouse.x > 650 || mouse.y < 75)
    for (let part of game.parts) part.selected = false

  else clicked = true
}

function getOffset() {
  offset = document.getElementById('C').getBoundingClientRect()
}

document.addEventListener('mousemove', mouseMove)
document.addEventListener('mousedown', mouseDown)
window.addEventListener('resize', getOffset)

function loop() {
  game.background()

  if (!game.paused) {
    game.punkte = game.parts.filter(p => p.org == p.pos && p.dir == 0).length
    game.timer++
    game.show()
    for (let part of game.parts)
      part.check() 
  }

  else ctx.drawImage(game.pic, 50, 75)

  requestAnimationFrame(loop)
}

window.onload = function() {
  ctx = document.getElementById('C').getContext('2d')
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 2.3
  
  for (let i = 0; i < 1; i++) {
    images[i] = new Image()
    images[i].src = `./rsc/img${i}.jpg`
  }

  for (let i = 0; i < 4; i++) {
    audios[i] = new Audio()
    audios[i].src = `./rsc/aud${i}.wav`
  }
  audios[1].volume = .35

  game = new Game()
  game.init()

  loop()
}

class Game {
  constructor() {
    this.timer   = 0
    this.running = true
    this.paused  = false
    this.pic     = images[0]
    this.diff    = 0
    this.punkte
  }

  init() {
    getOffset()
    this.parts   = []
    let max      = 150

    for (let i = 0; i < max; i++) 
      this.parts[i] = new Part(i)

    this.parts.sort((a, b) => a.rand - b.rand)

    for (let i = 0; i < this.parts.length; i++)
      this.parts[i].getCoord(i)
  }

  background() {
    ctx.clearRect(0, 0, 700, 500)
    rect(498, 15, 150, 50, '#6495ED', true)
    let text = game.paused ? 'Zurueck' : 'Bild sehen'
    write(`Zeit:  ${Math.floor(game.timer / 60)} sec`, 55, 28, 20, 'gold', 'left')
    write(`Treffer:  ${this.punkte}/150`, 55, 53, 20, 'gold', 'left')
    write(text, 573, 40, 25, '#006')
    write('1x klicken: auswaehlen', 320, 20, 18, '#6495ED')
    write('nochmal klicken: drehen', 320, 40, 18, '#6495ED')
    write('anderes klicken: tauschen', 320, 60, 18, '#6495ED')
  }

  show() {   
    for (let p of this.parts)
      p.show()
  }
}

class Part {
  constructor(i) {
    this.org       = i
    this.rand      = Math.random()
    this.size      = 40
    this.dir       = Math.floor(Math.random() * 4)
    this.xOrg      = (i % 15)           * this.size
    this.yOrg      = Math.floor(i / 15) * this.size
    this.selected  = false
    this.pos
  }

  static swap(a, b) {
    audios[1].play()
    let c      = a.pos
    a.pos      = b.pos
    b.pos      = c
    a.selected = false
    b.selected = false
    a.getCoord()
    b.getCoord()
    game.parts.sort((a,b) => a.pos - b.pos)
    if ((a.pos == a.org && a.dir == 0) || (b.pos == b.org && b.dir == 0))
      audios[2].play()
  }

  check() {
    if (mouse.x >= this.x && mouse.x <= this.x + this.size &&
        mouse.y >= this.y && mouse.y <= this.y + this.size && clicked)
    this.chosen()
  }

  getCoord(i = this.pos) {
    this.pos      = this.pos || i
    this.x        = (this.pos % 15)           * this.size + 50
    this.y        = Math.floor(this.pos / 15) * this.size + 75   
  }

  show() { 
    ctx.save()
    ctx.translate(this.x + this.size/2, this.y + this.size/2)
    ctx.rotate([0, .5, 1, 1.5][this.dir] * Math.PI)
    ctx.drawImage(game.pic, this.xOrg, this.yOrg, this.size, this.size, 
                 -this.size/2, -this.size/2, this.size, this.size)
    if (!(this.org == this.pos && this.dir == 0)) {
      rect(-this.size/2, -this.size/2, this.size, this.size, 'rgba(60, 60, 60, .5)', true)
      rect(-this.size/2 + 1, -this.size/2 + 1, this.size - 2, this.size - 2, '#006', false)
    }

    if (this.selected) {
      let col = `rgba(255, 255, 255, ${-(game.timer % 60) / 90 + 1})`
      rect(-this.size/2 + 1, -this.size/2 + 1, this.size - 2, this.size - 2, col, false)
    }

    
    ctx.restore()
  }

  chosen() {
    clicked = false
    if (this.selected) {
      this.dir = (this.dir + 1) % 4
      if (this.pos == this.org && this.dir == 0)
        audios[2].play()
      else
        audios[0].play()
    }
    else if (!game.parts.some(p => p.selected)) {
      this.selected = true
    }
    else for (let p of game.parts)
      if (p.selected && p != this) 
        Part.swap(this, p)

  }

}