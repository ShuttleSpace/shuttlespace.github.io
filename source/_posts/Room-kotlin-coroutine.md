---
title: Room & kotlin coroutine
date: 2019-03-03 08:53:01
tags:
  - Room
  - 数据库
  - Kotlin
  - Kotlin 协程
---

#### Overview

Room 2.1 开始支持 Kotlin 协程。DAO 方法可以使用 suspend 标记以确保这些方法不会在主线程中被执行。
Room 使用 `Executor`(来自框架组件) 作为 `Dispatcher` 运行 SQL 语句，当然在编译 `RoomDatabase` 时，你也可以提供自己的 `Executor`.

> 当前协程支持正在开发中，更多特性正在计划中

### 添加依赖

请升级 Room 到 v2.1, 同时 Kotlin v1.3.0+ , Coroutines v1.0.0+

```groovy
implementation "androidx.room:room-coroutines:${versions.room}"
```

现在就可以使用啦

```kotlin
@Dao
interface UsersDao {

    @Query("SELECT * FROM users")
    suspend fun getUsers(): List<User>

    @Query("UPDATE users SET age = age + 1 WHERE userId = :userId)
    suspend fun incrementUserAge(userId: String)

    @Insert
    suspend fun insertUser(user: User)

    @Update
    suspend fun updateUser(user: User)

    @Delete
    suspend fun deleteUser(user: User)
}
```

在调用其他 suspending DAO 函数时，@Transaction 也可以被 suspending

```kotlin

@Dao
abstract class UsersDao {
    @Transaction
    open suspend fun setLoggedInUser(loggedInUser: user) {
        deleteUser(loggedInUser)
        insertUser(loggedInUser)
    }

    @Query("DELETE FROM users")
    abstract fun deleteUser(user: User)

    @Insert
    abstract suspend fun insertUser(user: User)
}
```

根据是否在 transaction 内调用，Room 对 suspending 函数处理逻辑不同.

- 在 Transaction 中
  > 在数据库语句被触发的 CoroutineContext 下，Room 不做任何处理。函数调用者应该确保此方法不会在 UI 线程中执行.因为 suspend 函数只能被其他 suspend 函数 或在 coroutine 内调用，所以你不能把 Dispatchers.Main 赋值给 Dispatcher，应该是 Dispatchers.IO 或自定义
- 不在 Transaction 中
  > Room 会确保数据库语句在 `Architecutre Components I/O Dispatcher` 中触发。该 Dispatcher 在同一个 I/O Executor 的一个后台线程中运行 LiveData

### 底层

```kotlin
@Insert
fun insertUserSync(user: User)

@Insert
suspend fun insertUser(user: User)
```

对于同步 insert,生成的代码开始启动一个 transaction,然后执行 insert,标记 transaction successfull ，终结。
同步方法在被调用处的线程执行.

```kotlin
@Override
public void insertUserSync(final User user) {
  __db.beginTransaction();
  try {
    __insertionAdapterOfUser.insert(user);
    __db.setTransactionSuccessful();
  } finally {
    __db.endTransaction();
  }
}
```

suspending 会确保不会在 UI 线程中执行。生成的代码会传递一个 Continuation.在 `Callable#call()` 中执行和同步相同的代码

```kotlin
@Override
public Object insertUserSuspend(final User user,
    final Continuation<? super Unit> p1) {
  return CoroutinesRoom.execute(__db, new Callable<Unit>() {
    @Override
    public Unit call() throws Exception {
      __db.beginTransaction();
      try {
        __insertionAdapterOfUser.insert(user);
        __db.setTransactionSuccessful();
        return kotlin.Unit.INSTANCE;
      } finally {
        __db.endTransaction();
      }
    }
  }, p1);
}
```

`CoroutinesRoom.execute` 会根据数据库是否 open,当前调用是否在 transaction 内来切换处理 context.

- is open & in transaction
  > 仅调用 insert 逻辑
- not in transaction
  > 使用 `Architecture Components IO Executor` 在后台线程执行 insert 逻辑
