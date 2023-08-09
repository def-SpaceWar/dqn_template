import { drawLoop, updateLoop } from "./util";

import "./style.css";
import { Player } from "./game/player";
import { Platform } from "./game/platform";
import { type Rank, type Tensor, tensor } from "@tensorflow/tfjs";
import { DQNAgent } from "./agent/dqn/dqn_agent";
import { makeModel } from "./agent/dqn/model";

const PREFIX =
    "default";
const currentRoundNum = parseInt(
    localStorage.getItem(`${PREFIX}-round`) ||
    "0"
);

export const [width, height] = [800, 800];

(async function() {
    const model1 = makeModel(12, 4);
    const model2 = makeModel(12, 4);
    const agent1 = new DQNAgent(model1);
    const agent2 = new DQNAgent(model2);

    const distanceSquared = (p1: Player, p2: Player) =>
        (p1.pos[0] - p2.pos[0]) ** 2 + (p1.pos[1] - p2.pos[1]) ** 2;


    enum ACTIONS {
        MOVE_LEFT,
        MOVE_RIGHT,
        MOVE_JUMP,
        ATTACK,
    }

    const getReward = (agent: DQNAgent, main: Player, other: Player) => {
        let reward = 0;
        switch (agent.action) {
        case ACTIONS.MOVE_LEFT:
            if (main.pos[0] < other.pos[0]) {
                reward -= 1;
            } else {
                reward += 1;
            }
            if (distanceSquared(main, other) < 10_000 && main.attackCooldown <= 0) {
                reward -= 100;
            }
            if (main.pos[0] > width - 100) {
                reward += 50;
            }
            break;
        case ACTIONS.MOVE_RIGHT:
            if (main.pos[0] > other.pos[0]) {
                reward -= 1;
            } else {
                reward += 1;
            }
            if (distanceSquared(main, other) < 10_000 && main.attackCooldown <= 0) {
                reward -= 100;
            }
            if (main.pos[0] < 100) {
                reward += 50;
            }
            break;
        case ACTIONS.MOVE_JUMP:
            if (main.pos[1] < other.pos[1]) {
                reward -= 1;
            } else {
                reward += 1;
            }
            if (distanceSquared(main, other) < 10_000 && main.attackCooldown <= 0) {
                reward -= 100;
            }
            break;
        case ACTIONS.ATTACK:
            if (distanceSquared(main, other) < 10_000 && main.attackCooldown <= 0) {
                reward += 1;
            }
            break;
        }
        return reward;
    };

    const platforms = [
        new Platform(0, height - 100, width, 100, "grey")
    ];

    const player1 = new Player(100, 200, 1);
    const player2 = new Player(width - 200, 200, 2);

    const getInputs = (playerNum = 1): Tensor<Rank> => {
        switch (playerNum) {
        case 1:
            return tensor([[
                player1.pos[0],
                player1.pos[1],
                player1.vel[0],
                player1.vel[1],
                player1.attackCooldown,
                player1.health,
                player2.pos[0],
                player2.pos[1],
                player2.vel[0],
                player2.vel[1],
                player2.attackCooldown,
                player2.health,
            ]]);
        case 2:
        default:
            return tensor([[
                player2.pos[0],
                player2.pos[1],
                player2.vel[0],
                player2.vel[1],
                player2.attackCooldown,
                player2.health,
                player1.pos[0],
                player1.pos[1],
                player1.vel[0],
                player1.vel[1],
                player1.attackCooldown,
                player1.health,
            ]]);
        }
    };

    const stopUpdate = updateLoop(update, 60, true);
    const stopDraw = drawLoop(draw, [width, height], true);

    const restart = () => {
        stopUpdate();
        stopDraw();
        agent1.save(`localstorage://${PREFIX}-agent1`);
        agent2.save(`localstorage://${PREFIX}-agent2`);
        localStorage.setItem(`${PREFIX}-round`, (currentRoundNum + 1).toString());
        window.location.reload();
    };

    async function update(dt: number) {
        if (player1.pos[1] > height * 2) restart();
        if (player2.pos[1] > height * 2) restart();
        if (player1.health <= 0) restart();
        if (player2.health <= 0) restart();

        const state1 = getInputs(1);
        const state2 = getInputs(2);

        const move1 = await agent1.predictMove(state1);
        const move2 = await agent2.predictMove(state2);

        switch (move1) {
        case 0:
            player1.move("left");
            break;
        case 1:
            player1.move("right");
            break;
        case 2:
            player1.jump();
            break;
        case 3:
        default:
            player1.attack(player2);
            break;
        }

        switch (move2) {
        case 0:
            player2.move("left");
            break;
        case 1:
            player2.move("right");
            break;
        case 2:
            player2.jump();
            break;
        case 3:
        default:
            player2.attack(player1);
            break;
        }

        const newState1 = getInputs(1);
        const newState2 = getInputs(2);

        const reward1 = getReward(agent1, player1, player2);
        const reward2 = getReward(agent2, player2, player1);

        agent1.storeData(state1, move1, reward1, newState1);
        if (agent1.memory.length > agent1.batchSize) await agent1.train();
        agent2.storeData(state2, move2, reward2, newState2);
        if (agent2.memory.length > agent2.batchSize) await agent2.train();

        player1.update(dt, platforms);
        player2.update(dt, platforms);
    }

    function draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, width, height);

        player1.draw(ctx);
        player2.draw(ctx);

        platforms.forEach(p => p.draw(ctx));
    }
})();
