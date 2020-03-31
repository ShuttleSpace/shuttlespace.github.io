---
title: ObjectBox入门-5-LiveData
date: 2019-02-24 23:07:57
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
## LiveData (Arch.Comp.)

从 1.2.0 开始支持 `Android Architecture Components`
ObjectBox 提供 `ObjectBoxLiveData` 可以在 ViewModel 中使用

```java
public class NoteViewModel extends ViewModel {
    private ObjectBoxLiveData<Note> noteLiveData;

    public ObjectBoxLiveData<Note> getNoteLiveData(Box<Note> notesBox) {
        if (noteLiveData == null) {
            // 查询所有的 notes, text 按 a-z 的顺序排列
            noteLiveData = new ObjectBoxLiveData(notesBox.query().order(Note_.text).build());
        }
        return noteLiveData;
    }
}
```

- 上一种方法需要传入 Box.可以使用 `AndroidViewModel` 代替，它可以访问 Application context,然后会在 ViewModel 中调用 `((App)getApplication()).getBoxStore().boxFor()`.第一种的优势在于没有引用 Android 类，所以可以进行单元测试。

```java
NoteViewModel model = ViewModelProviders.of(this).get(NoteViewModel.class);
model.getNoteLiveData(notesBox).observe(this,new Observer<List<Note>>{
    @Override
    public void onChanged(@Nullable List<Node> notes) {
        notesAdapter.setNotes(notes);
    }
})
```

## Paging (Arch.Comp.)

从 2.0.0 开始支持.ObjectBox 提供了 `ObjectBoxDataSource` 类.它继承了 paging 库的 `PositionalDataSource`
在 ViewModel 中，类似创建 LiveData,先创建 ObjectBox query.然后构造并使用 ObjectBoxDataSource 工厂代替 LiveData.

```java
public class NotePageViewModel extends ViewModel {
    private LiveData<PagedList<Note>> noteLiveDataPaged;

    public LiveData<PagedList<Note>> getNoteLiveDataPaged(Box<Note> notesBox) {
        if(noteLiveDataPaged == null) {
            Query<Note> query = notesBox.query().order(Note_.text).build();
            noteLiveDataPaged = new LivePagedListBuilder(
                new ObjectBoxDataSource.Factory(query),
                20 // 页数
            ).build();
        }
        return noteLiveDataPaged;
    }
}
```
