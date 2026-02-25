export function evalMath(expression: string): number {
    const rpnStack: string[] = [];
    const workingStack: string[] = [];

    let lastToken: string | undefined;
    for (let i = 0, len = expression.length; i < len; i++) {
        const token = expression[i];

        if (!token || token === ' ') {
            continue;
        }

        if (operators.has(token)) {
            const op = operators.get(token);

            while (workingStack.length) {
                const currentOp = operators.get(workingStack[0]);
                if (!currentOp) {
                    break;
                }

                if (op!.lessOrEqualThan(currentOp)) {
                    rpnStack.push(workingStack.shift()!);
                } else {
                    break;
                }
            }
            workingStack.unshift(token);
        } else if (!lastToken || operators.has(lastToken)) {
            rpnStack.push(token);
        } else {
            rpnStack[rpnStack.length - 1] += token;
        }
        lastToken = token;
    }

    rpnStack.push(...workingStack);

    const stack: number[] = [];
    for (let i = 0, len = rpnStack.length; i < len; i++) {
        const op = operators.get(rpnStack[i]);
        if (op) {
            const args = stack.splice(0, 2);
            stack.push(op.exec(args[1], args[0]));
        } else {
            stack.unshift(parseFloat(rpnStack[i]));
        }
    }

    return stack[0];
}

class Operator {
    private precendce: number;
    private execMethod: (left: number, right: number) => number;

    constructor(precedence: number, method: (left: number, right: number) => number) {
        this.precendce = precedence;
        this.execMethod = method;
    }

    exec(left: number, right: number): number {
        return this.execMethod(left, right);
    }

    lessOrEqualThan(op: Operator) {
        return this.precendce <= op.precendce;
    }
}

const operators: Readonly<Map<string, Operator>> = new Map([
    ['+', new Operator(1, (left: number, right: number): number => left + right)],
    ['-', new Operator(1, (left: number, right: number): number => left - right)],
    ['*', new Operator(2, (left: number, right: number): number => left * right)],
    ['/', new Operator(2, (left: number, right: number): number => left / right)],
]);
