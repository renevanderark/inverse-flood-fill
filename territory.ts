interface BoundingBox {
    top: number,
    left: number,
    right: number,
    bottom: number
}

enum PositionStatus {
    Open = 0,
    Taken,
    Doomed,
    Territory
}

interface GridPosition {
    status: PositionStatus,
    x: number,
    y: number,
    pos: number
}

const WIDTH = 100;
const HEIGHT = 100;

let hasResult = false;

const getX = (position: number): number => position % WIDTH;
const getY = (position: number): number => Math.floor(position / WIDTH);

const iNeighbours = (position: number) => [position - 1, position + 1, position + WIDTH, position - WIDTH]
    .filter((neighbour) => neighbour > -1 && neighbour < HEIGHT * WIDTH && getX(neighbour) === getX(position) || getY(neighbour) === getY(position));

let grid: Array<number> = [];
function generateGrid() {
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < WIDTH; y++) {
            const currentPosition = (x + y * WIDTH);
            if (!hasResult) {
                grid[currentPosition] = Math.random() > .95 ? 1 : 0;
                hasResult = grid[currentPosition] === 1;
            } else if (iNeighbours(currentPosition).map((neighbour) => grid[neighbour]).indexOf(1) > -1) {
                grid[currentPosition] = Math.random() > .3 ? 1 : 0;
            } else {
                grid[currentPosition] = 0;
            }
        }
    }
}
generateGrid();


function generatePositions() {
    return grid.map((val, pos): GridPosition => ({
        x: getX(pos),
        y: getY(pos),
        status: val === 1 ? PositionStatus.Taken : PositionStatus.Open,
        pos: pos
    }));
}
const gridPositions = generatePositions();

const neighbours = (position: number) => [position - 1, position + 1, position + WIDTH, position - WIDTH]
    .filter((neighbour) => neighbour > -1 && neighbour < HEIGHT * WIDTH && getX(neighbour) === getX(position) || getY(neighbour) === getY(position));

const xWithin = (position: GridPosition, bounds: BoundingBox) : boolean =>
    position.x >= bounds.left && position.x <= bounds.right;

const yWithin = (position: GridPosition, bounds: BoundingBox) : boolean =>
    position.y >= bounds.top && position.y <= bounds.bottom;

const withinBox =  (position: GridPosition, bounds: BoundingBox) : boolean =>
    xWithin(position, bounds) && yWithin(position, bounds);

const openNeighbours = (position: GridPosition, bounds: BoundingBox) => neighbours(position.pos)
    .map((neighPos) => gridPositions[neighPos])
    .filter((neighbour) => neighbour.status === PositionStatus.Open)
    .filter((neighbour) => withinBox(neighbour, bounds));

const getBoundingBox = (positions: Array<GridPosition>): BoundingBox => ({
    top: Math.min(...positions.map((gp) => gp.y)),
    left: Math.min(...positions.map((gp) => gp.x)),
    right: Math.max(...positions.map((gp) => gp.x)),
    bottom: Math.max(...positions.map((gp) => gp.y))
});



/// BEGIN

const box = getBoundingBox(gridPositions.filter((gPos) => gPos.status === PositionStatus.Taken));

const addToDoomedList = (initialPosition: GridPosition) => {
    let doomedPositions = [initialPosition];

    while (doomedPositions.length > 0) {
        const currentPosition = doomedPositions.pop();
        currentPosition.status = PositionStatus.Doomed;
        openNeighbours(currentPosition, box)
            .filter((neighbour) => neighbour.status !== PositionStatus.Doomed)
            .forEach((neighbour) => doomedPositions.push(neighbour));
    }
};

const conditionalAddToDoomedList = (position: GridPosition) => {
    if(position.status === PositionStatus.Open) {
        addToDoomedList(position);
    }
};

const before = new Date().getTime();
for (let x = box.left; x <= box.right; x++) {
    const currentTopPosition = x + box.top * WIDTH;
    const currentBottomPosition = x + box.bottom * WIDTH;
    conditionalAddToDoomedList(gridPositions[currentTopPosition]);
    conditionalAddToDoomedList(gridPositions[currentBottomPosition]);
}

for (let y = box.top; y <= box.bottom; y++) {
    const currentLeftPosition = box.left + y * WIDTH;
    const currentRightPosition = box.right + y * WIDTH;
    conditionalAddToDoomedList(gridPositions[currentLeftPosition]);
    conditionalAddToDoomedList(gridPositions[currentRightPosition]);
}

const after = new Date().getTime() - before;

for (let y = 0; y < Math.floor(grid.length / WIDTH); y++) {
    let row: Array<string> = [];
    for (let x = 0; x < WIDTH; x++) {
        const currentPosition = x + y * WIDTH;
        const currentGridPosition = gridPositions[currentPosition];
        if (currentGridPosition.status === PositionStatus.Doomed) {
            row.push(" ");
        } else if (currentGridPosition.status === PositionStatus.Taken) {
            row.push("+")
        } else if (withinBox(currentGridPosition, box)) {
            row.push("*");
        } else {
            row.push(" ");
        }
    }
    console.log(row.join(" "));
}
console.log("TIMED", after + "ms");
