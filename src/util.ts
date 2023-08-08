export const updateLoop = (callback: (dt: number) => void, tps: number, speedUp = false) => {
    const tick = 1000 / tps,
        dt = tick / 1000;

    const interval = setInterval(() => {
        callback(dt);
    }, speedUp ? 0 : tick);

    return () => {
        clearInterval(interval);
    };
};

export const drawLoop = (callback: (ctx: CanvasRenderingContext2D) => void, dimensions: [width: number, height: number], enable = true) => {
    if (!enable) return () => { };
    const canvas = document.getElementById("app")!.appendChild(document.createElement("canvas")),
        ctx = canvas.getContext("2d")!;

    [canvas.width, canvas.height] = dimensions;

    let id: number;
    const animationFrame = () => {
        callback(ctx);
        id = requestAnimationFrame(animationFrame);
    };
    id = requestAnimationFrame(animationFrame);

    return () => {
        canvas.remove();
        cancelAnimationFrame(id);
    };
};

export type Vector = [x: number, y: number];

type Collidable = {
    pos: Vector,
    dimensions: Vector
};

export const isCollided = (c1: Collidable, c2: Collidable) => {
    let collided = true;
    const pos1 = c1.pos,
        pos2 = c2.pos,
        dim1 = c1.dimensions,
        dim2 = c2.dimensions;
    for (let i = 0; i < 2; i++) {
        const isOverlap = (pos1[i] + dim1[i] > pos2[i] && pos1[i] < pos2[i] + dim2[i]) || (pos2[i] + dim2[i] > pos1[i] && pos2[i] < pos1[i] + dim1[i]);
        collided = collided && isOverlap;
    }
    return collided;
};

export const pause = (secs: number): Promise<null> => {
    return new Promise((res) => {
        setTimeout(() => res(null), secs * 1_000);
    });
};
