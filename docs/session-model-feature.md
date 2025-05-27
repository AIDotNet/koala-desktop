# 会话模型保存功能

## 功能概述

现在 Koala Desktop 支持为每个会话保存选择的模型，当您切换到不同的会话时，应用会自动恢复该会话之前选择的模型。

## 实现的功能

### 1. 会话模型持久化
- 每个会话现在都会保存用户选择的模型
- 当用户在会话中切换模型时，选择会自动保存到该会话
- 下次打开该会话时，会自动恢复之前选择的模型

### 2. 新会话模型继承
- 创建新会话时，会使用当前选择的模型作为默认模型
- 确保用户体验的连续性

### 3. 模型可用性验证
- 当恢复会话的模型选择时，会验证该模型是否仍然可用
- 如果模型不可用（例如被禁用），会保持当前的模型选择

## 技术实现

### 数据库结构更新

```typescript
export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  createdAt: number
  updatedAt: number
  selectedModel?: string // 新增：保存会话选择的模型
}
```

### 新增的数据库方法

```typescript
// 更新会话的选择模型
async updateSessionModel(sessionId: string, selectedModel: string): Promise<void>

// 创建新会话时支持指定模型
async createDefaultSession(selectedModel?: string): Promise<ChatSession>
```

### 数据库版本升级

- 数据库版本从 v2 升级到 v3
- 自动为现有会话添加 `selectedModel` 字段
- 支持从 v1 和 v2 的平滑升级

## 使用方法

### 用户操作
1. 在任何会话中选择一个模型
2. 该选择会自动保存到当前会话
3. 切换到其他会话，再回到原会话时，模型选择会自动恢复
4. 创建新会话时，会使用当前选择的模型

### 开发者集成
```typescript
// 处理模型变更
const handleModelChange = async (modelId: string) => {
  setSelectedModel(modelId)
  
  // 如果当前有会话，保存模型选择到会话中
  if (sessionId) {
    try {
      await chatSessionDB.updateSessionModel(sessionId, modelId)
      console.log(`已保存模型选择 ${modelId} 到会话 ${sessionId}`)
    } catch (error) {
      console.error('保存模型选择失败:', error)
    }
  }
}
```

## 兼容性

- 向后兼容：现有会话会在首次使用时自动添加模型字段
- 数据迁移：自动处理从旧版本数据库的升级
- 错误处理：即使保存失败，也不会影响当前的模型选择

## 注意事项

1. **模型可用性**：如果会话保存的模型在当前配置中不可用，会保持当前选择的模型
2. **性能影响**：模型选择的保存是异步操作，不会阻塞用户界面
3. **数据一致性**：每次模型变更都会更新会话的 `updatedAt` 时间戳

## 测试建议

1. 创建新会话，选择不同的模型
2. 切换到其他会话，再回到原会话，验证模型选择是否恢复
3. 在设置中禁用某个模型，验证使用该模型的会话是否正确处理
4. 测试数据库升级：从旧版本升级到新版本，验证数据迁移是否正确

## 故障排除

如果遇到模型选择不保存的问题：

1. 检查浏览器控制台是否有数据库错误
2. 确认 IndexedDB 是否正常工作
3. 验证会话 ID 是否正确传递
4. 检查模型 ID 是否有效

## 未来改进

- 支持为不同类型的对话（如代码、创意写作等）设置默认模型
- 添加模型使用统计和推荐功能
- 支持模型配置的导入导出 