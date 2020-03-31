---
title: ObjectBox入门-12-事务
date: 2019-02-26 00:38:55
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
ObjectBox 是一个满足 ACID 特性的交易型数据库.一个事务可以包含一组操作，要么执行成功，要么全部失败。
几乎所有的 ObjectBox 的操作都包含了事务。比如 `put(),read()`。普通情况下，不用关心这些底层的事务。但某些复杂的情况下，手动处理事务操作可以使你的 app 更加高效一致。

### 手动事务

ObjectBox 提供了如下方法实现手动事务：

- runInTx: 在事务中运行指定的 runnable
- runInReadTx: 在一个只读的事务中运行指定的 runnable.不同于写入事务，多个只读事务可以同时运行。
- runInTxAsync: 在另一个线程中运行指定的 runnable.一旦事务执行完毕，callback(可为 null) 将被调用.
- callInTx: 类似 runInTx(Runnable),但是有返回值或抛出异常.

对批量存入操作进行手动事务的优势是你可以实现任意数量的操作，使用多个 box 对象。同时，在事务执行过程中，可以对数据有一个直观的认知。

```java
// 写入事务
boxStore.runInTx(() -> {
  for (User user: allUsers) {
    if (modify(user)) box.put(user);
    else box.remove(user);
  }
})
```

### 事务代价

理解事务可以很好的帮助掌握数据库性能。请注意: 写入事务代价大.
提交事务包含了将数据同步到物理存储中的操作，这对数据库是一个相对昂贵的操作。只有文件系统确认所有的数据都存储，事务操作才会被认为是成功的。事务同步该文件可能需要几毫秒。请记住：尽量把多个操作(put 等)放入同一个事务中.

```java
// 不推荐
for(User user: allUsers) {
   modify(user); // modifies properties of given user
   box.put(user);
}
// 推荐
for(User user: allUsers) {
   modify(user); // modifies properties of given user
}
box.put(allUsers);
```

### 读取事务

ObjectBox 的读取事务很快。相对于写入事务，没有 commit 操作，所以没有昂贵的同步文件系统。请注意：在一个读取事务中 put 操作是非法的，会抛出一个异常。get,count,queries 等操作没有手动声明事务(读写),默认会运行在一个读取事务.
虽然读取事务比写入事务代价小，但是还是最好把它放入读取事务中。

### 多版本的并发

ObjectBox 提供了语义化的多版本并发控制(Multiversion concurrency control MVCC).多个并发读取(读取事务)可以立即执行，无需阻塞或等待。这是通过存储多个版本的（提交）数据来实现的。即便一个写入事务正在运行，读取事务也可以立即获取到最新的同步状态。写入事务按顺序执行以便状态一致。所以保证写入事务短小可以避免阻塞其他写入事务。因此在一个写入事务中执行网络操作或复杂计算不推荐。尽量在写入事务前完成这些操作。

注意不需要自己手动维持写入事务序列。如果多线程想同时执行写入事务(put,runInTx),同一时刻只有一个线程可以执行，其他必须等待。类似 Java 中的 lock 或 synchronized。

#### 深入写入事务

尽量避免在写入事务中使用锁(`synchronized` 或 `java.util.concurrent.locks`).因为写入事务运行费时，所以 ObjectBox 内部会获取一个写入锁。当设计多个锁时，请提高警惕。
始终以相同的顺序获取锁可以避免死锁。如果在一个事务获取了 X 锁，请保证你的代码在持有 X 锁时没有在另外一个写入事务中执行.
