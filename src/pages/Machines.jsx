import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, DotLoading, Empty, ErrorBlock, PullToRefresh, SearchBar, Space, Tag, Toast } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { fetchEquipments } from '../api/equipments'
import {
  getMachineCardVariant,
  getMachineStatusTitle,
  getNetworkBarLevel,
  shouldShowWifiBars,
  sortMachinesForDisplay,
} from '../utils/machineCard'

function formatRpm4(v) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—'
  return Number(v).toFixed(4)
}

function WifiBars({ level, variant, ariaLabel }) {
  const heights = [5, 8, 11, 14]
  return (
    <div className="wifi-bars" role="img" aria-label={ariaLabel}>
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
  const { t } = useTranslation()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [keyword, setKeyword] = useState('')

  const load = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const data = await fetchEquipments({ page: 1, size: 999 })
      setList(data?.list ?? [])
    } catch (e) {
      setErr(e.message || t('machines.loadFail'))
      Toast.show({ icon: 'fail', content: e.message })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const displayList = useMemo(() => {
    const sorted = [...list].sort(sortMachinesForDisplay)
    const k = keyword.trim().toLowerCase()
    if (!k) {
      return sorted
    }
    return sorted.filter((e) => {
      const name = String(e.name ?? '').toLowerCase()
      const sn = String(e.snCode ?? '').toLowerCase()
      return name.includes(k) || sn.includes(k)
    })
  }, [list, keyword])

  return (
    <div className="page machines-page machines-page--layout">
      {loading && !list.length ? (
        <div className="page-pad page-loading">
          <DotLoading color="primary" />
        </div>
      ) : err && !list.length ? (
        <div className="page-pad">
          <ErrorBlock status="default" title={err} description={t('machines.pullRetry')} />
        </div>
      ) : (
        <>
          <div className="machines-page-toolbar">
            <SearchBar
              className="machines-search-bar"
              placeholder={t('machines.searchPlaceholder')}
              value={keyword}
              onChange={setKeyword}
              onClear={() => setKeyword('')}
              style={{
                '--background': '#ffffff',
                '--border-radius': '12px',
                '--height': '40px',
                '--padding-left': '12px',
                '--placeholder-color': '#8c8c8c',
              }}
            />
          </div>
          <div className="machines-page-list-scroll">
            <PullToRefresh onRefresh={load}>
              <div className="machines-page-list-pad">
                {!displayList.length ? (
                  <Empty
                    className="machines-search-empty"
                    description={keyword.trim() ? t('machines.noMatch') : t('machines.empty')}
                  />
                ) : (
                  <Space direction="vertical" block className="list-stack">
                  {displayList.map((e) => {
                const variant = getMachineCardVariant(e)
                const statusTitle = getMachineStatusTitle(e, t)
                const showWifi = shouldShowWifiBars(e)
                const wifiLevel = getNetworkBarLevel(e.others?.network)
                return (
                  <div key={e.uid} className={`machine-card-shell machine-card-shell--${variant}`}>
                    <Card
                      className="machine-card-inner"
                      title={
                        <div className="machine-card-title-row">
                          <span className="machine-card-name">{e.name}</span>
                          {showWifi ? (
                            <WifiBars
                              level={wifiLevel}
                              variant={variant}
                              ariaLabel={t('machines.wifiAria', { n: wifiLevel })}
                            />
                          ) : null}
                        </div>
                      }
                    >
                      <div className="machine-card-status-line">
                        <Tag round color="primary" fill="outline" className="machine-card-status-tag">
                          {statusTitle}
                        </Tag>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted">
                        <span className="machine-card-meta-k">{t('machines.place')}</span>
                        <span className="machine-card-meta-v">{e.place || '—'}</span>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted">
                        <span className="machine-card-meta-k">{t('machines.sn')}</span>
                        <span className="machine-card-meta-v">{e.snCode ?? '—'}</span>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted machine-card-rpm-line">
                        <span className="machine-card-meta-k">{t('machines.rpm')}</span>
                        <span className="machine-card-meta-v">{formatRpm4(e.others?.speed)}</span>
                      </div>
                    </Card>
                  </div>
                )
                  })}
                  </Space>
                )}
              </div>
            </PullToRefresh>
          </div>
        </>
      )}
    </div>
  )
}
