// 内置 Java 基础题库（15 题，7 个主题）。OJ 风格：写 Main.java，Scanner 读输入、println 输出。
import { Exercise } from '../types';

export const EXERCISES: Exercise[] = [
  // ========== 变量（2 题） ==========
  {
    id: 'ex-var-01',
    title: '交换两个变量',
    topic: '变量',
    difficulty: 'easy',
    tags: ['变量', '赋值', '临时变量'],
    description:
      '读入两个整数 `a` 和 `b`，**交换它们的值**后，用空格分隔输出 `a` 和 `b`。\n\n示例：输入 `3 5`，输出 `5 3`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // TODO: 交换 a 和 b 的值（提示：用一个临时变量）

        System.out.println(a + " " + b);
    }
}`,
    testCases: [
      { input: '3 5\n', expectedOutput: '5 3', hint: '用一个临时变量保存其中一个值' },
      { input: '10 20\n', expectedOutput: '20 10' },
      { input: '-2 7\n', expectedOutput: '7 -2' },
    ],
    hints: [
      '用一个临时变量 `temp` 先保存 `a` 的值。',
      '三步：`temp = a` → `a = b` → `b = temp`。',
    ],
    explanation: '交换两个变量需要借助第三个临时变量，否则一个值会被覆盖丢失。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int temp = a;
        a = b;
        b = temp;
        System.out.println(a + " " + b);
    }
}`,
  },
  {
    id: 'ex-var-02',
    title: '圆的面积',
    topic: '变量',
    difficulty: 'easy',
    tags: ['变量', '浮点数', 'printf'],
    description:
      '读入圆的半径 `r`（整数），计算圆的面积（圆周率取 `3.14`），**保留两位小数**输出。\n\n示例：输入 `2`，输出 `12.56`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int r = sc.nextInt();
        // TODO: 计算面积 = 3.14 * r * r，用 printf 保留两位小数输出

    }
}`,
    testCases: [
      { input: '2\n', expectedOutput: '12.56', hint: '用 double 类型，printf("%.2f%n", 面积)' },
      { input: '5\n', expectedOutput: '78.50' },
      { input: '1\n', expectedOutput: '3.14' },
    ],
    hints: [
      '半径是整数，但面积可能是小数，要用 `double` 类型。',
      '用 `System.out.printf("%.2f%n", area)` 保留两位小数。',
    ],
    explanation: '整数与浮点运算会得到浮点结果；`%.2f` 格式化输出保留两位小数。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int r = sc.nextInt();
        double area = 3.14 * r * r;
        System.out.printf("%.2f%n", area);
    }
}`,
  },

  // ========== 数据类型（2 题） ==========
  {
    id: 'ex-dt-01',
    title: '求平均值',
    topic: '数据类型',
    difficulty: 'easy',
    tags: ['整数', '浮点', '类型转换'],
    description:
      '读入三个整数，输出它们的**平均值**（浮点数，保留两位小数）。\n\n示例：输入 `1 2 3`，输出 `2.00`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        // TODO: 计算平均值并保留两位小数输出（注意整数除法会丢掉小数）

    }
}`,
    testCases: [
      { input: '1 2 3\n', expectedOutput: '2.00', hint: '除以 3.0 而不是 3' },
      { input: '10 20 30\n', expectedOutput: '20.00' },
      { input: '1 1 2\n', expectedOutput: '1.33' },
    ],
    hints: [
      '整数除以整数结果是整数（截断），要得到小数需除以 `3.0`。',
      '用 `double avg = (a + b + c) / 3.0;` 再 `printf("%.2f%n", avg)`。',
    ],
    explanation: 'Java 中整数/整数会做整数除法丢掉小数；让其中一个操作数为浮点即可得到浮点结果。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        double avg = (a + b + c) / 3.0;
        System.out.printf("%.2f%n", avg);
    }
}`,
  },
  {
    id: 'ex-dt-02',
    title: '字符的 ASCII 码',
    topic: '数据类型',
    difficulty: 'easy',
    tags: ['char', '类型转换', 'ASCII'],
    description:
      '读入一个字符，输出它的 **ASCII 码**（整数）。\n\n示例：输入 `A`，输出 `65`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char c = sc.next().charAt(0);
        // TODO: 把字符 c 转成整数并输出

    }
}`,
    testCases: [
      { input: 'A\n', expectedOutput: '65', hint: 'char 可以直接赋值给 int' },
      { input: 'a\n', expectedOutput: '97' },
      { input: '0\n', expectedOutput: '48' },
    ],
    hints: [
      'Java 中 `char` 可以直接赋值给 `int`，得到其 Unicode/ASCII 码。',
      '`int code = c;` 然后 `System.out.println(code);`。',
    ],
    explanation: 'char 本质是 0~65535 的整数，直接赋值给 int 即可得到编码值。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char c = sc.next().charAt(0);
        int code = c;
        System.out.println(code);
    }
}`,
  },

  // ========== 运算符（2 题） ==========
  {
    id: 'ex-op-01',
    title: '四则运算',
    topic: '运算符',
    difficulty: 'easy',
    tags: ['运算符', 'switch', '整数除法'],
    description:
      '读入两个整数 `a`、`b` 和一个运算符 `op`（`+` `-` `*` `/`），输出 `a op b` 的运算结果。除法为整数除法（保证 `b` 不为 0）。\n\n示例：输入 `6 3 +`，输出 `9`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        String op = sc.next();
        // TODO: 根据 op 做对应运算并输出结果（用 if-else 或 switch）

    }
}`,
    testCases: [
      { input: '6 3 +\n', expectedOutput: '9' },
      { input: '6 3 -\n', expectedOutput: '3' },
      { input: '6 3 *\n', expectedOutput: '18' },
      { input: '6 3 /\n', expectedOutput: '2' },
    ],
    hints: [
      '运算符用字符串读入，用 `op.equals("+")` 判断。',
      '可以用 `switch (op)` 分支，注意除法是 `/`。',
    ],
    explanation: '根据运算符字符串做分支运算；注意整数除法会截断。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        String op = sc.next();
        int result = 0;
        switch (op) {
            case "+": result = a + b; break;
            case "-": result = a - b; break;
            case "*": result = a * b; break;
            case "/": result = a / b; break;
        }
        System.out.println(result);
    }
}`,
  },
  {
    id: 'ex-op-02',
    title: '商和余数',
    topic: '运算符',
    difficulty: 'easy',
    tags: ['运算符', '取模', '整除'],
    description:
      '读入两个整数 `a`、`b`，输出 `a` 除以 `b` 的**商**和**余数**（空格分隔）。\n\n示例：输入 `17 5`，输出 `3 2`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // TODO: 计算商 a/b 和余数 a%b，用空格分隔输出

    }
}`,
    testCases: [
      { input: '17 5\n', expectedOutput: '3 2' },
      { input: '10 3\n', expectedOutput: '3 1' },
      { input: '7 2\n', expectedOutput: '3 1' },
    ],
    hints: ['商是 `a / b`，余数是 `a % b`。'],
    explanation: '`/` 求整数商，`%` 求余数（模）。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println((a / b) + " " + (a % b));
    }
}`,
  },

  // ========== 条件（3 题） ==========
  {
    id: 'ex-cond-01',
    title: '判断奇偶',
    topic: '条件',
    difficulty: 'easy',
    tags: ['if-else', '取模'],
    description:
      '读入一个整数，判断是**偶数**还是**奇数**，输出「偶数」或「奇数」。\n\n示例：输入 `4`，输出 `偶数`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO: 判断 n 的奇偶并输出「偶数」或「奇数」

    }
}`,
    testCases: [
      { input: '4\n', expectedOutput: '偶数' },
      { input: '7\n', expectedOutput: '奇数' },
      { input: '0\n', expectedOutput: '偶数' },
    ],
    hints: ['能被 2 整除就是偶数，即 `n % 2 == 0`。'],
    explanation: '用 `n % 2 == 0` 判断偶数，否则奇数。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (n % 2 == 0) {
            System.out.println("偶数");
        } else {
            System.out.println("奇数");
        }
    }
}`,
  },
  {
    id: 'ex-cond-02',
    title: '成绩等级',
    topic: '条件',
    difficulty: 'easy',
    tags: ['if-else', '多分支'],
    description:
      '读入分数（0~100），输出等级：`>=90` 优秀，`>=80` 良好，`>=60` 及格，`<60` 不及格。\n\n示例：输入 `85`，输出 `良好`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int score = sc.nextInt();
        // TODO: 按分数段输出「优秀」「良好」「及格」「不及格」

    }
}`,
    testCases: [
      { input: '95\n', expectedOutput: '优秀' },
      { input: '85\n', expectedOutput: '良好' },
      { input: '75\n', expectedOutput: '及格' },
      { input: '59\n', expectedOutput: '不及格' },
    ],
    hints: ['从高分往低分判断：先 `>= 90`，再 `>= 80`，依次类推。'],
    explanation: '多分支判断要按顺序，先判高分再判低分，避免区间重叠。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int score = sc.nextInt();
        if (score >= 90) {
            System.out.println("优秀");
        } else if (score >= 80) {
            System.out.println("良好");
        } else if (score >= 60) {
            System.out.println("及格");
        } else {
            System.out.println("不及格");
        }
    }
}`,
  },
  {
    id: 'ex-cond-03',
    title: '三个数最大值',
    topic: '条件',
    difficulty: 'medium',
    tags: ['if-else', '比较'],
    description:
      '读入三个整数，输出它们的**最大值**。\n\n示例：输入 `3 9 5`，输出 `9`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        // TODO: 找出三个数中的最大值并输出（提示：先找 a、b 的较大者，再和 c 比）

    }
}`,
    testCases: [
      { input: '3 9 5\n', expectedOutput: '9' },
      { input: '10 2 7\n', expectedOutput: '10' },
      { input: '-1 -5 -3\n', expectedOutput: '-1' },
    ],
    hints: [
      '先 `max = (a > b ? a : b)` 得到前两个的较大者。',
      '再 `if (c > max) max = c;`。',
    ],
    explanation: '两两比较：先求前两个的最大值，再和第三个比较。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        int max = a > b ? a : b;
        if (c > max) max = c;
        System.out.println(max);
    }
}`,
  },

  // ========== 循环（2 题） ==========
  {
    id: 'ex-loop-01',
    title: '1 到 N 求和',
    topic: '循环',
    difficulty: 'easy',
    tags: ['for', '累加'],
    description:
      '读入正整数 `N`，输出 `1 + 2 + ... + N` 的和。\n\n示例：输入 `5`，输出 `15`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO: 用循环累加 1 到 n 的和并输出

    }
}`,
    testCases: [
      { input: '5\n', expectedOutput: '15' },
      { input: '10\n', expectedOutput: '55' },
      { input: '1\n', expectedOutput: '1' },
    ],
    hints: ['`int sum = 0;` 然后用 `for (int i = 1; i <= n; i++) sum += i;`。'],
    explanation: '累加求和：循环变量从 1 到 n，每次加到 sum。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        System.out.println(sum);
    }
}`,
  },
  {
    id: 'ex-loop-02',
    title: '九九乘法表第 N 行',
    topic: '循环',
    difficulty: 'medium',
    tags: ['for', '嵌套循环', '格式化输出'],
    description:
      '读入 `N`（1~9），输出 `N` 的乘法表，从 `N*1` 到 `N*9`，每行一个算式，格式为 `N*i=结果`。\n\n示例：输入 `3`，输出：\n```\n3*1=3\n3*2=6\n...\n3*9=27\n```',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // TODO: 循环输出 n*i=结果（i 从 1 到 9）

    }
}`,
    testCases: [
      {
        input: '3\n',
        expectedOutput: '3*1=3\n3*2=6\n3*3=9\n3*4=12\n3*5=15\n3*6=18\n3*7=21\n3*8=24\n3*9=27',
      },
      { input: '5\n', expectedOutput: '5*1=5\n5*2=10\n5*3=15\n5*4=20\n5*5=25\n5*6=30\n5*7=35\n5*8=40\n5*9=45' },
    ],
    hints: [
      '`for (int i = 1; i <= 9; i++)` 循环。',
      '每次输出 `System.out.println(n + "*" + i + "=" + (n * i));`。',
    ],
    explanation: '循环 9 次，每次拼接字符串输出乘法算式。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 1; i <= 9; i++) {
            System.out.println(n + "*" + i + "=" + (n * i));
        }
    }
}`,
  },

  // ========== 数组（2 题） ==========
  {
    id: 'ex-arr-01',
    title: '数组求和',
    topic: '数组',
    difficulty: 'easy',
    tags: ['数组', 'for', '累加'],
    description:
      '读入 `N` 和 `N` 个整数，输出它们的**和**。\n\n示例：输入 `5 1 2 3 4 5`，输出 `15`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        // TODO: 累加数组所有元素并输出

    }
}`,
    testCases: [
      { input: '5 1 2 3 4 5\n', expectedOutput: '15' },
      { input: '3 10 20 30\n', expectedOutput: '60' },
      { input: '1 7\n', expectedOutput: '7' },
    ],
    hints: ['`int sum = 0;` 然后 `for` 循环遍历数组累加。'],
    explanation: '遍历数组，用累加变量求所有元素之和。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += arr[i];
        }
        System.out.println(sum);
    }
}`,
  },
  {
    id: 'ex-arr-02',
    title: '数组最大值',
    topic: '数组',
    difficulty: 'easy',
    tags: ['数组', 'for', '比较'],
    description:
      '读入 `N` 和 `N` 个整数，输出其中的**最大值**。\n\n示例：输入 `5 3 9 1 7 5`，输出 `9`。',
    starterCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        // TODO: 找出数组最大值并输出（提示：先假设 arr[0] 最大）

    }
}`,
    testCases: [
      { input: '5 3 9 1 7 5\n', expectedOutput: '9' },
      { input: '3 10 20 30\n', expectedOutput: '30' },
      { input: '4 -1 -5 -3 -2\n', expectedOutput: '-1' },
    ],
    hints: [
      '`int max = arr[0];` 然后从下标 1 开始遍历比较。',
      '遇到更大的就更新 `max`。',
    ],
    explanation: '先假设第一个元素最大，遍历其余元素，遇到更大的就更新。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        int max = arr[0];
        for (int i = 1; i < n; i++) {
            if (arr[i] > max) max = arr[i];
        }
        System.out.println(max);
    }
}`,
  },

  // ========== 方法（2 题） ==========
  {
    id: 'ex-method-01',
    title: '计算阶乘',
    topic: '方法',
    difficulty: 'medium',
    tags: ['方法', '递归或循环', '返回值'],
    description:
      '读入 `N`（0~12），**写一个方法**计算 `N` 的阶乘（`N!`），输出结果。\n\n示例：输入 `5`，输出 `120`。',
    starterCode: `import java.util.Scanner;

public class Main {
    // TODO: 写一个方法 factorial(int n)，返回 n 的阶乘

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(factorial(n));
    }
}`,
    testCases: [
      { input: '5\n', expectedOutput: '120' },
      { input: '0\n', expectedOutput: '1' },
      { input: '10\n', expectedOutput: '3628800' },
    ],
    hints: [
      '阶乘定义：`0! = 1`，`n! = n * (n-1)!`。',
      '可以用循环累乘，或递归：`n == 0 ? 1 : n * factorial(n-1)`。',
    ],
    explanation: '方法封装计算逻辑；阶乘可用循环或递归实现，注意 0! = 1。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static int factorial(int n) {
        if (n == 0) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(factorial(n));
    }
}`,
  },
  {
    id: 'ex-method-02',
    title: '判断素数',
    topic: '方法',
    difficulty: 'medium',
    tags: ['方法', '循环', '布尔'],
    description:
      '读入正整数 `N`，**写一个方法**判断它是否是素数，输出「是素数」或「不是素数」。\n\n示例：输入 `7`，输出 `是素数`。',
    starterCode: `import java.util.Scanner;

public class Main {
    // TODO: 写一个方法 isPrime(int n)，判断 n 是否为素数（返回 boolean）

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (isPrime(n)) {
            System.out.println("是素数");
        } else {
            System.out.println("不是素数");
        }
    }
}`,
    testCases: [
      { input: '7\n', expectedOutput: '是素数' },
      { input: '10\n', expectedOutput: '不是素数' },
      { input: '2\n', expectedOutput: '是素数' },
      { input: '1\n', expectedOutput: '不是素数' },
    ],
    hints: [
      '素数：大于 1 且只能被 1 和自身整除。',
      '`n < 2` 返回 false；从 2 到 `sqrt(n)` 试除，能整除则不是素数。',
    ],
    explanation: '判断素数：小于 2 不是素数；否则试除到根号 n，能整除则不是。',
    solutionCode: `import java.util.Scanner;

public class Main {
    public static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        if (isPrime(n)) {
            System.out.println("是素数");
        } else {
            System.out.println("不是素数");
        }
    }
}`,
  },
];
