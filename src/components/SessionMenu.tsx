import React, { useState } from 'react'
import { Dropdown, Modal, Input, message } from 'antd'
import { Edit3, Trash2, MoreHorizontal } from 'lucide-react'
import type { MenuProps } from 'antd'
import { ChatSession } from '@/utils/indexedDB'
import './SessionMenu.css'

interface SessionMenuProps {
  session: ChatSession
  onEdit: (sessionId: string, newTitle: string) => Promise<void>
  onDelete: (sessionId: string) => Promise<void>
  className?: string
}

const SessionMenu: React.FC<SessionMenuProps> = ({ 
  session, 
  onEdit, 
  onDelete, 
  className = '' 
}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      message.error('会话标题不能为空')
      return
    }

    setIsLoading(true)
    try {
      await onEdit(session.id, editTitle.trim())
      setIsEditModalVisible(false)
      message.success('会话标题已更新')
    } catch (error) {
      message.error('更新失败')
      console.error('Edit session error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '删除会话',
      content: `确定要删除会话"${session.title}"吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await onDelete(session.id)
          message.success('会话已删除')
        } catch (error) {
          message.error('删除失败')
          console.error('Delete session error:', error)
        }
      }
    })
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#d1d5db' 
        }}>
          <Edit3 size={14} />
          <span>编辑标题</span>
        </div>
      ),
      onClick: () => {
        setEditTitle(session.title)
        setIsEditModalVisible(true)
      }
    },
    {
      key: 'delete',
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#f87171' 
        }}>
          <Trash2 size={14} />
          <span>删除会话</span>
        </div>
      ),
      onClick: handleDelete
    }
  ]

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        overlayClassName="session-menu-dropdown"
      >
        <div
          style={{
            padding: '4px',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={14} style={{ color: '#9ca3af' }} />
        </div>
      </Dropdown>

      <Modal
        title="编辑会话标题"
        open={isEditModalVisible}
        onOk={handleEdit}
        onCancel={() => setIsEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
        confirmLoading={isLoading}
      >
        <div style={{ padding: '16px 0' }}>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="请输入会话标题"
            maxLength={50}
            style={{
              background: '#374151',
              borderColor: '#4b5563',
              color: '#ffffff',
            }}
            onPressEnter={handleEdit}
            autoFocus
          />
        </div>
      </Modal>
    </>
  )
}

export default SessionMenu 