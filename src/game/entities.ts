import { PlatformData, EnemyData } from '../types';
import { SpriteService } from '../services/spriteService';

export class Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;

  constructor(x: number, y: number, width: number, height: number, color: string) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  collidesWith(other: Entity) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}

export class Cheetah extends Entity {
  vx: number = 0;
  vy: number = 0;
  speed: number = 9; // Increased for better jump distance
  jumpForce: number = -17; // Increased again for better reach
  gravity: number = 0.55; // Decreased slightly for floatier jumps
  isGrounded: boolean = false;
  dashMultiplier: number = 2.0;
  isDashing: boolean = false;
  dashCooldown: number = 0;
  dashDuration: number = 0;
  direction: 'left' | 'right' = 'right';
  animationFrame: number = 0;
  image: HTMLImageElement;
  imageLoaded: boolean = false;
  frameCount: number = 8;
  cols: number = 8;
  rows: number = 1;
  isGenerating: boolean = false;

  // Juicy physics variables
  coyoteTime: number = 0;
  jumpBuffer: number = 0;
  maxCoyoteTime: number = 8;
  maxJumpBuffer: number = 8;
  isJumping: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, 120, 60, '#EAB308'); // Hitbox size
    this.image = new Image();
    this.image.crossOrigin = "anonymous";
    
    this.loadSprite();
  }

  async loadSprite() {
    const spriteService = SpriteService.getInstance();
    
    // Set fallback immediately so we have something to show
    const rawUrl = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a90244e9-9c2c-47bd-843b-5b7e8e51fa6d/dai5pkv-583f09c9-b325-4fa7-8754-d74a3e91c758.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi9hOTAyNDRlOS05YzJjLTQ3YmQtODQzYi01YjdlOGU1MWZhNmQvZGFpNXBrdi01ODNmMDljOS1iMzI1LTRmYTctODc1NC1kNzRhM2U5MWM3NTgucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.LBQkL31WYt0KK6rIcJ-gmT0GAMhh8kstEDKE-JEYadw';
    this.image.onload = () => {
      this.imageLoaded = true;
      // If we haven't loaded a generated one yet, treat as single frame
      if (!spriteService.getGeneratedUrl()) {
        this.frameCount = 1;
        this.cols = 1;
        this.rows = 1;
      }
    };
    this.image.src = `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}`;

    // Now try to get/generate the high-quality one
    let url = spriteService.getGeneratedUrl();
    if (!url) {
      this.isGenerating = true;
      url = await spriteService.generateCheetahSpriteSheet();
      this.isGenerating = false;
    }

    if (url) {
      const newImage = new Image();
      newImage.crossOrigin = "anonymous";
      newImage.onload = () => {
        this.image = newImage;
        this.imageLoaded = true;
        this.frameCount = 8;
        this.cols = 4;
        this.rows = 2;
      };
      newImage.src = url;
    }
  }

  update(keys: Record<string, boolean>, platforms: PlatformData[]) {
    let currentSpeed = this.speed;

    // Dash logic
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.dashDuration > 0) {
      this.dashDuration--;
      currentSpeed *= this.dashMultiplier;
    } else {
      this.isDashing = false;
    }

    if (keys['Space'] && this.dashCooldown === 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDuration = 12; // Slightly longer dash
      this.dashCooldown = 45;
    }

    // Horizontal movement
    this.vx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.vx = -currentSpeed;
      this.direction = 'left';
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.vx = currentSpeed;
      this.direction = 'right';
    }

    // Jump Buffering
    if (keys['ArrowUp'] || keys['KeyW']) {
      this.jumpBuffer = this.maxJumpBuffer;
    }
    if (this.jumpBuffer > 0) this.jumpBuffer--;

    // Coyote Time
    if (this.isGrounded) {
      this.coyoteTime = this.maxCoyoteTime;
      this.isJumping = false;
    } else {
      if (this.coyoteTime > 0) this.coyoteTime--;
    }

    // Jump execution
    if (this.jumpBuffer > 0 && this.coyoteTime > 0 && !this.isJumping) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
      this.isJumping = true;
    }

    // Variable Jump Height (Jump higher if button held)
    if (!(keys['ArrowUp'] || keys['KeyW']) && this.vy < 0 && this.isJumping) {
      this.vy *= 0.6; // Cut upward velocity if button released early
    }

    // Apply gravity
    this.vy += this.gravity;

    // Movement and Collision
    this.x += this.vx;
    this.checkHorizontalCollisions(platforms);
    
    this.y += this.vy;
    this.checkVerticalCollisions(platforms);

    if (this.vx !== 0) {
      this.animationFrame += 0.55; 
    } else {
      this.animationFrame += 0.15; // Slow idle animation
    }
  }

  checkHorizontalCollisions(platforms: PlatformData[]) {
    for (const p of platforms) {
      if (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y) {
        if (this.vx > 0) this.x = p.x - this.width;
        if (this.vx < 0) this.x = p.x + p.width;
      }
    }
  }

  checkVerticalCollisions(platforms: PlatformData[]) {
    this.isGrounded = false;
    for (const p of platforms) {
      if (this.x < p.x + p.width && this.x + this.width > p.x && this.y < p.y + p.height && this.y + this.height > p.y) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.height;
          this.vy = 0;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (this.direction === 'left') ctx.scale(-1, 1);

    if (this.imageLoaded && this.image.naturalWidth > 0 && this.frameCount > 1) {
      const frameIndex = Math.floor(this.animationFrame % this.frameCount);
      const col = frameIndex % this.cols;
      const row = Math.floor(frameIndex / this.cols);
      
      const sourceFrameWidth = this.image.naturalWidth / this.cols;
      const sourceFrameHeight = this.image.naturalHeight / this.rows;

      // Calculate display dimensions based on aspect ratio to prevent stretching
      const aspectRatio = sourceFrameWidth / sourceFrameHeight;
      const displayWidth = 250; 
      const displayHeight = displayWidth / aspectRatio;

      // Draw the specific frame
      ctx.drawImage(
        this.image,
        col * sourceFrameWidth, row * sourceFrameHeight, // Source x, y
        sourceFrameWidth, sourceFrameHeight,             // Source width, height
        -displayWidth / 2, -displayHeight / 2,           // Destination x, y (centered)
        displayWidth, displayHeight                      // Destination width, height
      );
    } else {
      // Procedural animation (always animated)
      const frame = Math.floor(this.animationFrame % 9);
      
      // Leg positions based on 9-frame gallop cycle
      const legFrames = [
        [-20, 25, -30, 20, 30, 25, 40, 20], // Frame 0: Extended
        [-10, 20, -20, 25, 20, 30, 30, 25], // Frame 1: Front landing
        [0, 15, -10, 20, 10, 30, 20, 30],   // Frame 2: Supporting
        [10, 10, 0, 15, 0, 25, 10, 25],     // Frame 3: Tucked
        [5, 15, 15, 10, -10, 20, 0, 20],    // Frame 4: Tucked push
        [-10, 20, 5, 15, -20, 15, -10, 15], // Frame 5: Back push
        [-25, 25, -15, 20, -10, 10, 0, 10], // Frame 6: Extension start
        [-35, 20, -25, 25, 10, 15, 20, 10], // Frame 7: Extension mid
        [-40, 15, -30, 20, 25, 20, 35, 15], // Frame 8: Full extension
      ];

      const [bl1x, bl1y, bl2x, bl2y, fl1x, fl1y, fl2x, fl2y] = legFrames[frame];
      const bodyArch = [0, 2, 5, 8, 6, 3, 0, -2, -3][frame];
      const bodyColor = '#d4a356';

      // Draw legs
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      
      // Back legs
      ctx.beginPath(); ctx.moveTo(-15, 10 + bodyArch); ctx.lineTo(bl2x, bl2y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, 10 + bodyArch); ctx.lineTo(bl1x, bl1y); ctx.stroke();
      
      // Front legs
      ctx.beginPath(); ctx.moveTo(15, 10 + bodyArch); ctx.lineTo(fl2x, fl2y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, 10 + bodyArch); ctx.lineTo(fl1x, fl1y); ctx.stroke();

      // Draw body
      ctx.save();
      ctx.translate(0, bodyArch);
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.bezierCurveTo(-45, -25, 45, -25, 45, 0);
      ctx.bezierCurveTo(45, 15, -45, 15, -45, 0);
      ctx.fill();

      // Add spots
      ctx.fillStyle = '#332211';
      for (let i = 0; i < 10; i++) {
        const sx = -30 + (i * 7) % 60;
        const sy = -10 + Math.sin(i * 1.5) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw head
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(45, -15, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Ears
      ctx.beginPath();
      ctx.ellipse(40, -25, 4, 6, -Math.PI/6, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(50, -18, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      const tailWag = this.vx === 0 ? Math.sin(Date.now() / 200) * 10 : 0;
      ctx.quadraticCurveTo(-60, -10 + tailWag, -55, 20 + tailWag);
      ctx.stroke();

      ctx.restore();
    }

    if (this.isGenerating) {
      // Draw a loading indicator overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-60, 45, 120, 18);
      ctx.fillStyle = '#EAB308';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GENERATING HQ...', 0, 57);
    }

    // Dash effect (always show this)
    if (this.isDashing) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      const bodyArch = [0, 2, 5, 8, 6, 3, 0, -2, -3][Math.floor(this.animationFrame % 9)];
      for(let i=0; i<3; i++) {
        ctx.beginPath();
        ctx.moveTo(-50 - i*10, -10 + i*10 + bodyArch);
        ctx.lineTo(-80 - i*10, -10 + i*10 + bodyArch);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export class Meat extends Entity {
  collected: boolean = false;
  bob: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 40, 40, '#EF4444');
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.collected) return;
    this.bob += 0.1;
    const yOffset = Math.sin(this.bob) * 5;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + yOffset);
    
    // Bone
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.roundRect(-22, -4, 15, 8, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-22, -4, 5, 0, Math.PI * 2);
    ctx.arc(-22, 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Meat Body
    const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
    gradient.addColorStop(0, '#f87171');
    gradient.addColorStop(1, '#991b1b');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.bezierCurveTo(15, -15, 25, 0, 15, 12);
    ctx.bezierCurveTo(5, 15, -15, 12, -10, -12);
    ctx.fill();
    
    // Fat/Marbling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -8);
    ctx.quadraticCurveTo(8, 0, -2, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.quadraticCurveTo(12, 2, 5, 10);
    ctx.stroke();

    ctx.restore();
  }
}

export class Platform extends Entity {
  type: PlatformData['type'];

  constructor(data: PlatformData) {
    super(data.x, data.y, data.width, data.height, '#4B5563');
    this.type = data.type;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.type === 'grass') {
      // Dirt base
      ctx.fillStyle = '#78350F';
      ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
      // Grass top
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(this.x, this.y, this.width, 15);
      // Grass blades
      ctx.beginPath();
      for (let x = this.x; x < this.x + this.width; x += 10) {
        ctx.moveTo(x, this.y);
        ctx.lineTo(x + 5, this.y - 5);
        ctx.lineTo(x + 10, this.y);
      }
      ctx.fill();
    } else if (this.type === 'rock') {
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      for (let i = 0; i < this.width; i += 40) {
        ctx.strokeRect(this.x + i, this.y, 40, this.height);
      }
    } else if (this.type === 'dirt') {
      ctx.fillStyle = '#451A03';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#78350F';
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'sand') {
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#F59E0B';
      ctx.beginPath();
      for (let x = this.x; x < this.x + this.width; x += 20) {
        ctx.moveTo(x, this.y + 5);
        ctx.quadraticCurveTo(x + 10, this.y, x + 20, this.y + 5);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class Enemy extends Entity {
  startX: number;
  startY: number;
  speed: number;
  range: number;
  direction: number = 1;

  constructor(data: EnemyData) {
    super(data.x, data.y, 60, 40, '#991B1B');
    this.startX = data.x;
    this.startY = data.y;
    this.speed = data.speed;
    this.range = data.range;
  }

  update() {
    this.x += this.speed * this.direction;
    if (Math.abs(this.x - this.startX) > this.range) {
      this.direction *= -1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (this.direction < 0) ctx.scale(-1, 1);

    // Hyena-like enemy (Detailed)
    const hyenaColor = '#6b7280';
    const darkColor = '#374151';
    
    // Body (Sloped back)
    ctx.fillStyle = hyenaColor;
    ctx.beginPath();
    ctx.moveTo(-25, 10);
    ctx.lineTo(-20, -15); // High shoulder
    ctx.lineTo(15, -5);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(20, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.ellipse(15, -20, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(25, -12, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
