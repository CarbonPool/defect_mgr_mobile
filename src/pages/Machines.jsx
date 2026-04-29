import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, DotLoading, Empty, ErrorBlock, PullToRefresh, SearchBar, Toast } from 'antd-mobile'
import { EnvironmentOutline, ScanCodeOutline } from 'antd-mobile-icons'
import { useTranslation } from 'react-i18next'
import { fetchEquipments } from '../api/equipments'
import FanIcon from '../components/FanIcon'
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
                  <div className="machines-grid list-stack">
                  {displayList.map((e) => {
                const variant = getMachineCardVariant(e)
                const statusTitle = getMachineStatusTitle(e, t)
                const showWifi = shouldShowWifiBars(e)
                const wifiLevel = getNetworkBarLevel(e.others?.network)
                const rpmNum = Number(e.others?.speed)
                const rpmSpinning = Number.isFinite(rpmNum) && rpmNum !== 0
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
                        <span className={`machine-card-status-text machine-card-status-text--${variant}`}>
                          {statusTitle}
                        </span>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted">
                        <span
                          className="machine-card-meta-k machine-card-meta-k--place"
                          aria-label={t('machines.place')}
                          title={t('machines.place')}
                        >
                          <EnvironmentOutline className="machine-card-meta-place-icon" aria-hidden />
                        </span>
                        <span className="machine-card-meta-v">{e.place || '—'}</span>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted machine-card-meta-sn-line">
                        <span
                          className="machine-card-meta-k machine-card-meta-k--sn"
                          aria-label={t('machines.sn')}
                          title={t('machines.sn')}
                        >
                          <ScanCodeOutline className="machine-card-meta-sn-icon" aria-hidden />
                        </span>
                        <span className="machine-card-meta-v">{e.snCode ?? '—'}</span>
                      </div>
                      <div className="machine-card-meta machine-card-meta-row muted machine-card-rpm-line">
                        <span
                          className="machine-card-meta-k machine-card-meta-k--rpm"
                          aria-label={t('machines.rpm')}
                          title={t('machines.rpm')}
                        >
                          <FanIcon
                            size={17}
                            className={`machine-card-rpm-icon${rpmSpinning ? '' : ' machine-card-rpm-icon--still'}`}
                          />
                        </span>
                        <span className="machine-card-meta-v">{formatRpm4(e.others?.speed)}</span>
                      </div>
                    </Card>
                  </div>
                )
                  })}
                  </div>
                )}
              </div>
            </PullToRefresh>
          </div>
        </>
      )}
    </div>
  )
}
