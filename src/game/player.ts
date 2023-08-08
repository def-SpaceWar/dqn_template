import { width } from "../main";
import { Rectangle } from "../render/rectangle";
import { isCollided } from "../util";
import type { Vector } from "../util";
import type { Platform } from "./platform";

export class Player {
    pos: Vector;
    dimensions: Vector = [100, 100];
    rect: Rectangle;

    vel: Vector = [0, 0];
    grounded = false;
    gravity = 500;
    jumpPower = 600;

    moveSpeed = 300;
    moving = false;
    direction: "left" | "right" = "left";

    health = 100;
    healthRect: Rectangle;
    attackRange = 100;
    damage = 40;
    kbPower = 5;
    attackCooldown = 0;
    readonly attackCooldownTime = 1;

    constructor(x: number, y: number, public playerNum: 1 | 2) {
        this.pos = [x, y];

        switch (playerNum) {
        case 1:
            this.rect = new Rectangle(x, y, ...this.dimensions, "red");
            this.healthRect = new Rectangle(50, 50, 200, 50, "red");
            break;
        case 2:
            this.rect = new Rectangle(x, y, ...this.dimensions, "blue");
            this.healthRect = new Rectangle(width - 250, 50, 200, 50, "blue");
            break;
        }
    }

    move(direction: "left" | "right" | "none") {
        switch (direction) {
        case "none":
            this.moving = false;
            break;
        case "left":
        case "right":
            this.moving = true;
            this.direction = direction;
            break;
        }
    }

    jump() {
        if (!this.grounded) return;
        this.grounded = false;
        this.vel[1] -= this.jumpPower;
    }

    attack(other: Player) {
        if (this.attackCooldown > 0) return;
        if (other.health <= 0) return;
        const attackRangeSquared = this.attackRange * this.attackRange;
        let distanceSquared = 0;
        for (let i = 0; i < 2; i++) {
            distanceSquared += (this.pos[i] - other.pos[i]) ** 2;
        }
        if (distanceSquared < attackRangeSquared) {
            other.vel[0] += (other.pos[0] - this.pos[0]) * this.kbPower * (100 / other.health);
            other.vel[1] += (other.pos[1] - this.pos[1]) * this.kbPower * (100 / other.health);
            other.health -= this.damage * (distanceSquared / attackRangeSquared);
        }
        this.attackCooldown = this.attackCooldownTime;
    }

    update(dt: number, platforms: Platform[]): void {
        this.vel[0] *= Math.exp(-dt);
        this.vel[1] *= Math.exp(-dt);
        this.attackCooldown -= dt;

        this.pos[0] += this.vel[0] * dt;
        this.pos[1] += this.vel[1] * dt;

        if (this.moving) {
            this.vel[0] += ((this.direction == "left") ? -this.moveSpeed : this.moveSpeed) * dt;
        }

        for (let i = 0; i < platforms.length; i++) {
            if (isCollided(platforms[i], this)) {
                this.grounded = true;
                this.vel[1] = Math.min(0, this.vel[1]);
            }
        }
        if (!this.grounded) this.vel[1] += this.gravity * dt;

        this.rect.x = this.pos[0];
        this.rect.y = this.pos[1];

        switch (this.playerNum) {
        case 1:
            this.healthRect.w = Math.max(2 * this.health, 0);
            break;
        case 2:
            this.healthRect.x = width - 250 + (100 - this.health) * 2;
            this.healthRect.w = Math.max(2 * this.health, 0);
            break;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.rect.draw(ctx);
        this.healthRect.draw(ctx);
    }
}
