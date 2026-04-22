import { useCallback, useEffect, useState } from 'react'
import { Card, DotLoading, ErrorBlock, PullToRefresh, Space, Tag, Toast } from 'antd-mobile'
import { fetchEquipments } from '../api/equipments'
import {
  getMachineCardVariant,
  getMachineStatusTitle,
  getNetworkBarLevel,
  shouldShowWifiBars,
} from '../utils/machineCard'

function WifiBars({ level, variant }) {
  const heights = [5, 8, 11, 14]
  return (
    <div className="wifi-bars" role="img" aria-label={`网络约${level}格`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={`wifi-bar${i < level ? ' wifi-bar--on' : ''} wifi-bar--${variant}`}
          style={{ height: h }}
        />
      ))}
    </div>
  )
}

export default function Machines() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const data = await fetchEquipments({ page: 1, size: 999 })
      setList(data?.list ?? [])
    } catch (e) {
      setErr(e.message || '加载失败')
      Toast.show({ icon: 'fail', content: e.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page">
      <div className="page-pad">
        {loading && !list.length ? (
          <div className="page-loading">
            <DotLoading color="primary" />
          </div>
        ) : err && !list.length ? (
          <ErrorBlock status="default" title={err} description="下拉或点击重试" />
        ) : (
          <PullToRefresh onRefresh={load}>
            <Space direction="vertical" block className="list-stack">
              {list.map((e) => {
                const variant = getMachineCardVariant(e)
                const statusTitle = getMachineStatusTitle(e)
                const showWifi = shouldShowWifiBars(e)
                const wifiLevel = getNetworkBarLevel(e.others?.network)
                return (
                  <div key={e.uid} className={`machine-card-shell machine-card-shell--${variant}`}>
                    <Card
                      className="machine-card-inner"
                      title={
                        <div className="machine-card-title-row">
                          <span className="machine-card-name">{e.name}</span>
                          {showWifi ? <WifiBars level={wifiLevel} variant={variant} /> : null}
                        </div>
                      }
                    >
                      <div className="machine-card-status-line">
                        <Tag round color="primary" fill="outline" className="machine-card-status-tag">
                          {statusTitle}
                        </Tag>
                      </div>
                      <div className="machine-card-meta muted">地点 {e.place || '—'}</div>
                      <div className="machine-card-meta muted">项目 {e.project?.name ?? '—'}</div>
                      <Space style={{ marginTop: 8 }} wrap className="machine-card-tags">
                        <Tag color={e.online ? 'success' : 'default'}>{e.online ? '在线' : '离线'}</Tag>
                        <Tag color={e.status === 'ENABLE' ? 'primary' : 'default'}>
                          {e.status === 'ENABLE' ? '启用' : '禁用'}
                        </Tag>
                      </Space>
                    </Card>
                  </div>
                )
              })}
            </Space>
          </PullToRefresh>
        )}
      </div>
    </div>
  )
}
