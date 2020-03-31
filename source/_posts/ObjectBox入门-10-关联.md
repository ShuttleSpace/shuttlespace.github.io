---
title: ObjectBox入门-10-关联
date: 2019-02-25 22:49:13
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
Object 之间的关联具有方向性.关联是延迟初始化的：实际的引用对象只有在调用时才会从数据库中加载。一旦加载过，就会缓存起来.

### To-One 关联

![To-One示意图](http://qiniu.picbed.dang8080.cn/20190225232506.png)
使用 ToOne 会智能的对目标对象创建关联。同时获取目标对象缓存。

```java
// Customer.java
@Entity
public class Customer {
    @Id public long id;
}
// Order.java
@Entity
public class Order {
    @Id public long id;
    public ToOne<Customer> customer;
}
// 为了绑定 customer 对象，对 ToOne 实例调用 setTarget() 然后就存入 order 对象
Customer customer = new Customer();
Order order = new Order();
order.customer.setTarget(customer);
long orderId = boxStore.boxFor(Order.class).put(order);
```

> 如果 customer 在数据库中不存在，ToOne 将会存储。如果已经存在，那么 ToOne 只会创建关联,不会存储.
> 如果关联 Entity 使用的是自定义 IDs(@Id(assignable = true)),则该 Entity 不会被存储.

在 ToOne 实例中，可通过 Order 对象的 getTarget() 获取 customer

```java
Order order = boxStore.boxFor(Order.class).get(orderId);
Customer customer = order.customer.getTarget(customer);
```

如果只是想要获取 ID 而不是整个目标对象，getTargetId() 值得拥有，此方法根本不会接触数据库，所以高效。

移除关联: 仅移除关联关系，而不会从数据库中移除目标对象。

```java
order.customer.setTarget(null);
boxStore.boxFor(Order.class).put(order);
```

查看 `objectbox-models/default.json` 会发现，ToOne 属性根本没有保存。仅仅只是目标对象的 ID 保存在一个名称和 ToOne 属性后拼接 Id 的虚拟属性.

### 初始化魔术

注意到 ToOne 属性 customer 从没初始化，然而调用时却不会抛出空指针异常。因为该初始化已经执行过了。
ObjectBox 插件会对 entity 类(仅支持纯 Java 项目和 Android 项目) 在调用前正确的初始化。所以在自定义构造方法时，你可以假设 ToOne/ToMany/List 属性已经初始化过了。

```java
@Entity
public class Example {
    ToOne<Order> order;
    ToMany<Order> orders;
    transient BoxStore __boxStore;
    public Example() {
        //
        this.order = new ToOne<>(this, Example_.order);
        this.orders = new ToMany<>(this, Example_.orders);
    }
    public Example(String value) {
        this();
    }
}
```

### 提升性能

为了提高性能，请提供全参数构造方法。
对于 ToOne 属性，请添加一个名为 ToOne 属性名加 Id 的 id 参数。可以参考 objectbox-models/default.json 里的命名.

```java
@Entity
public class Order {
    @Id public long id;
    public ToOne<Customer> customer;
    public Order() { /* default constructor */ }
    public Order(long id, long customerId /* virtual ToOne id property */) {
        this.id = id;
        this.customer.setTargetId(customerId);
    }
}
```

### ToMany 关联

可以使用 List 或 ToMany 类型实现 ToMany 关联.相对 ToOne 来说，ToMany 可以实现追踪数据变化并将其写入操作中，而 List 必须自己实现.

### 1:N

![1:N](http://qiniu.picbed.dang8080.cn/20190226000315.png)

使用 @Backlink 注解 1:N 关联属性。

```java
// Customer.java
@Entity
public class Customer {

    @Id public long id;

    // 'to' is optional if only one relation matches
    @Backlink(to = "customer")
    public ToMany<Order> orders;

}

// Order.java
@Entity
public class Order {

    @Id public long id;

    public ToOne<Customer> customer;

}

Customer customer = new Customer();
customer.orders.add(new Order());
customer.orders.add(new Order());
long customerId = boxStore.boxFor(Customer.class).put(customer); // puts customer and orders

Customer customer = boxStore.boxFor(Customer.class).get(customerId);
for (Order order : customer.orders) {
    // TODO
}

Order order = customer.orders.remove(0);
boxStore.boxFor(Customer.class).put(customer);
// optional: also remove the order from its box
// boxStore.boxFor(Order.class).remove(order);
```

### N:N

![N:N](http://qiniu.picbed.dang8080.cn/20190226000708.png)

```java
// Teacher.java
@Entity
public class Teacher{

    @Id public long id;

}

// Student.java
@Entity
public class Student{

    @Id public long id;

    public ToMany<Teacher> teachers;

}

Teacher teacher1 = new Teacher();
Teacher teacher2 = new Teacher();

Student student1 = new Student();
student1.teachers.add(teacher1);
student1.teachers.add(teacher2);

Student student2 = new Student();
student2.teachers.add(teacher2);

// puts students and teachers
boxStore.boxFor(Student.class).put(student1, student2);

Student student1 = boxStore.boxFor(Student.class).get(student1.id);
for (Teacher teacher : student1.teachers) {
    // TODO
}

student1.teachers.remove(0);
// boxStore.boxFor(Student.class).put(student1);
// more efficient than using put:
student1.teachers.applyChangesToDb();
```

上面可以通过 student 知道 teacher 的信息，当然可以反过来

```java
// Teacher.java
@Entity
public class Teacher{

    @Id public long id;

    @Backlink(to = "teachers") // backed by the to-many relation in Student
    public ToMany<Student> students;

}

// Student.java
@Entity
public class Student{

    @Id public long id;

    public ToMany<Teacher> teachers;

}
```

### 更新关联

ToOne 和 ToMany 可以追踪变化（只要存入拥有关联属性的 entity）并将其存入数据库中，
如果 ID != 0 或者 @Id(assignable = true) 那么可以通过 Box 来更新关联

```java
// update a related entity using its box
Order orderToUpdate = customer.orders.get(0);
orderToUpdate.text = "Revised description";
// DOES NOT WORK
// boxStore.boxFor(Customer.class).put(customer);
// WORKS
boxStore.boxFor(Order.class).put(orderToUpdate);
```

#### 更新 ToOne

ToOne 类提供了如下方法更新关联:

- `setTarget(entity)`: 创建关联；传入 null 清除关联
- `setTargetId(entityId)`: 对存在的目标 entity 创建关联；传入 0 清除关联.
- `setAndPutTarget(entity)`:

```java
order.customer.setTarget(customer); // or order.customer.setCustomerId(customer.getId());
orderBox.put(order);
```

> 如果 entity 在调用 setAndPutTarget() 之前还没存储,那么需要先绑定它的 box

```java
Order order = new Order(); // new entity
orderBox.attach(order); // need to attach box first
order.customer.setAndPutTarget(customer);
```

如果目标 entity 使用自定义 IDs,必须在更新 ToOne 关联时存储它

```java
customer.id = 12; // self-assigned id
customerBox.put(customer); // need to put customer first
order.customer.setTarget(customer); // or order.customer.setCustomerId(customer.getId());
orderBox.put(order);
```

这是因为 ObjectBox 只保存 id 为 0 的关联对象.

#### 更新 ToMany

ToMany 实现了 java.lang.List 接口。如果向 ToMany 实例添加对象，这些对象就会被存储进数据库。移除也一样。（仅仅是关联被移除而已）.不要忘记把追踪 ToMany 改变的 own entity 对象存储.

```java
customer.orders.add(order1);
customer.orders.remove(order2);
customerBox.put(customer);
```

如果使用自定义 IDs(@Id(assignable = true)) 请在修改 ToMany 前绑定它的 box

```java
customer.id = 12; // self-assigned id
customerBox.attach(customer); // need to attach box first
customer.orders.add(order);
customerBox.put(customer);
```

如果 entity 是自定义 IDs,那么需要先存入该 entity,然后再更新关联并存储 own entity.

```java
order.id = 42; // self-assigned id
orderBox.put(order); // need to put order first
customer.orders.add(order);
customerBox.put(customer); // put customer, add relation to order
```

### 树形关联

可以使用 ToOne,ToMany 处理指向自身的树形关联

```java
@Entity
public class TreeNode {
    @Id long id;

    ToOne<TreeNode> parent;

    @BackLink
    ToMany<TreeNode> children;
}
```

生成的 entity 可以获取它的 parent 和 children

```java
TreeNode parent = entity.parent.getTarget();
List<TreeNode> children = entity.children;
```
