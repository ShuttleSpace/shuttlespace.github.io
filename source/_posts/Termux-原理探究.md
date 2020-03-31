---
title: Termux 原理探究
date: 2020-03-31 10:02:22
tags:
---
详细介绍请移步: ![官网](https://termux.com/),![中文镜像](http://www.termux.cn/),![清华源](https://mirror.tuna.tsinghua.edu.cn/help/termux/)

### 源码探究

```c++
static int create_subprocess(JNIEnv* env,
        char const* cmd,
        char const* cwd,
        char* const argv[],
        char** envp,
        int* pProcessId,
        jint rows,
        jint columns)
```
此方法即为 termux 的核心,通过该方法将用户输入的命令和当前工作的文件夹传入打开的终端去执行.

1、打开伪终端
```c++
 int ptm = open("/dev/ptmx", O_RDWR | O_CLOEXEC);
 if (ptm < 0) return throw_runtime_exception(env, "Cannot open /dev/ptmx");
 // UNIX98 的伪终端模式.
 // pts(pseudo-terminal slave)/ptmx(pseudo-terminal master) 结合使用即可实现 pty(pseudo-tty).
 // pts/ptmx 是成堆的逻辑终端设备(对 master 的操作会映射到 slave 上).
```

2、初始化设置
```c++
#ifdef LACKS_PTSNAME_R
    char* devname;
#else
    char devname[64];
#endif
    // grantpt 在伪终端 slave 设备可被使用之前设置权限,使应用程序可以访问它.
    // 把设备节点的 userid 设置为调用者的实际 userid, groupid 为一非指定值,通常可以是访问该终端设备的组.
    // 将权限设为: 对单个所有者是读写,对组所有者是写(0620).

    // unlockpt 用于准予对伪终端 slave 设备的访问,从而允许应用打开该设备.
    // 可以阻止其他进程打开该设备,使得建立该设备的应用程序有机会在使用master、slave 设备之前正确的初始化这些设备.
if (grantpt(ptm) || unlockpt(ptm) ||
#ifdef LACKS_PTSNAME_R 
            // 在给定伪终端 master 的设备文件符时,找到对应 slave 设备的路径名.
            // 如果成功,会在一个静态存储区存放设备名称并返回其地址,否则 NULL.
            // include <stdlib.h>
            // 返回指针不能被调用进程释放.
            (devname = ptsname(ptm)) == NULL
#else       
            // 可重入版本.
            ptsname_r(ptm, devname, sizeof(devname))
#endif
       ) {
        return throw_runtime_exception(env, "Cannot grantpt()/unlockpt()/ptsname_r() on /dev/ptmx");
    }

// Enable UTF-8 mode and disable flow control to prevent Ctrl+S from locking up the display.
struct termios tios;
// 返回 ptm 对应伪终端的属性.
tcgetattr(ptm, &tios);
// tcgetattr(STDIN_FILENO,&ts); STDIN_FILENO 值为1,表示标准输入的文件喵输入.
tios.c_iflag |= IUTF8;
tios.c_iflag &= ~(IXON | IXOFF); // 关闭输入时对 XON/XOFF流进行控制
tcsetattr(ptm, TCSANOW, &tios); 
// TCSANOW: 立即生效
// TCSADRAIN: 在所有写入 fd 的输出被传输后生效.建议在修改输出参数时使用.
// TCSAFLUSH: 在所有写入 fd 应用对象的输出都被传输后生效,所有已接受但未读入的输入都在改变生效前被丢弃

// 设置初始化窗口大小
// include <termios.h>
struct winsize sz = { .ws_row = (unsigned short) rows, .ws_col = (unsigned short) columns };
ioctl(ptm, TIOCSWINSZ, &sz); // 获取 winsize 值
// ioctl TIOCSWINSZ 命令也可将此结构的新值存放到内核中。如果此新值和存放在内核中的当前值不同,则向前台进程组发送 SIGWINCH 信号.
// ioctl(STDIN_FILENO,TIOCGWINSZ,&wz);
```

3、创建新进程
```c++
pid_t pid = fork();
if (pid < 0) {
    return throw_runtime_exception(env, "Fork failed");
} else if (pid > 0) {
    // 当前进程
    *pProcessId = (int) pid;
    return ptm;
} else {
    // Clear signals which the Android java process may have blocked:
    sigset_t signals_to_unblock;
    sigfillset(&signals_to_unblock); // 初始化 signals_to_unblock,然后将所有的信号加入此信号集.
    sigprocmask(SIG_UNBLOCK, &signals_to_unblock, 0);
    // SIG_BLOCK: 将参数二中的信号添加到信号屏蔽字中
    // SIG_SETMASK: 将信号屏蔽字设置为参数二中信号
    // SIG_UNBLOCK: 从信号屏蔽字中删除参数二中的信号.

    close(ptm);
    setsid();
    // 子进程从父进程继承了: SessionID, process GroupID 和打开的终端
    // setsid 帮助子进程脱离父进程继承的属性.

    int pts = open(devname, O_RDWR); // 打开伪终端 slave 设备.
    if (pts < 0) exit(-1);

    dup2(pts, 0);
    dup2(pts, 1);
    dup2(pts, 2);
    // 一般一个进程会有3个文件描述符存在(0,1,2)0 -> 进程的标准输入,1 -> 进程的标准输出,2 -> 进程的标准错误输出.
    // int dup(int oldfd); 
    // 内核在进程创建一个新的文件描述符,此描述符是当前可用文件描述符的最小数值,指向 oldfd 所拥有的文件表项.
    // int dup2(int oldfd,int newfd); 
    // 使用newfd 指定新描述符的数值,如果 newfd 已经打开,先将其关闭.如果 newfd 等于 oldfd,则返回 newfd,不关闭它.

    DIR* self_dir = opendir("/proc/self/fd"); // 当前进程打开的文件
    if (self_dir != NULL) {
        int self_dir_fd = dirfd(self_dir); // 把 DIR* 转为文件描述符
        struct dirent* entry;
        while ((entry = readdir(self_dir)) != NULL) {
            int fd = atoi(entry->d_name);
            if(fd > 2 && fd != self_dir_fd) close(fd); // 关闭打开的文件
        }
        closedir(self_dir);
    }

    clearenv(); // 删除环境表中所有的环境变量
    // getenv() 按环境变量的名称取得环境变量的值
    if (envp) for (; *envp; ++envp) putenv(*envp); // 将传进来的环境变量设为当前环境变量

    if (chdir(cwd) != 0) {
        char* error_message;
        // No need to free asprintf()-allocated memory since doing execvp() or exit() below.
        if (asprintf(&error_message, "chdir(\"%s\")", cwd) == -1) error_message = "chdir()";
        perror(error_message);
        fflush(stderr);
    }
    // 从 PATH 环境变量所值的目录中查找符合参数 cmd 的文件名,找到后便执行该文件,然后将第二个参数 argv 传给此文件.
    // 成功无返回，失败返回 -1,失败原因存于 errno 中.
    execvp(cmd, argv);
    // Show terminal output about failing exec() call:
    char* error_message;
    if (asprintf(&error_message, "exec(\"%s\")", cmd) == -1) error_message = "exec()";
    perror(error_message);
    _exit(1);
}
```

因为 termux 的主界面是一个 psuedo terminal,所以第一步先建立伪终端设备,然后创建当前进程的子进程去执行命令.因此,termux 能访问的就只能 termux app 私有文件目录及 SD 卡公开目录(需要特殊命令支持)
