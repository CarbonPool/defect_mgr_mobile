import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CapsuleTabs,
  Card,
  DotLoading,
  ErrorBlock,
  Image,
  ImageViewer,
  Picker,
  Space,
  Swiper,
  Tag,
  Toast,
} from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchEquipments } from '../api/equipments'
import { fetchDefectStatistics, fetchNgReasonStatistical, fetchNgRecords } from '../api/defect'
import { rangeThisMonth, rangeThisWeek, rangeToday } from '../api/timeRange'
import fanIcon from '../assets/icons/fan.svg'
import { resolveImageUrl } from '../utils/assetUrl'
import { buildNgPieSlicesFromStatisticalRows } from '../utils/ngReason'

const NG_PIE_COLORS = [
  '#1677ff',
  '#52c41a',
  '#faad14',
  '#ff4d4f',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
]

const NG_PIE_OTHER_COLOR = '#94a3b8'

function ngPieSliceColor(row) {
  const raw = String(row.code ?? '').trim()
  if (/^[0-7]$/.test(raw)) return NG_PIE_COLORS[Number(raw)]
  return NG_PIE_OTHER_COLOR
}

const RANGE_FNS = {
  today: rangeToday,
  week: rangeThisWeek,
  month: rangeThisMonth,
}

/** 转速保留四位小数 */
function formatSpeedDecimals(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return (0).toFixed(4)
  return n.toFixed(4)
}

export default function Home() {
  const { t } = useTranslation()
  const [equipments, setEquipments] = useState([])
  const [eqPickerVisible, setEqPickerVisible] = useState(false)
  const [eqValue, setEqValue] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [rangeKey, setRangeKey] = useState('today')
  const [swiperUrls, setSwiperUrls] = useState([])
  const [ngStatisticalData, setNgStatisticalData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')

  const rangeTabs = useMemo(
    () => [
      { key: 'today', label: t('home.range.today') },
      { key: 'week', label: t('home.range.week') },
      { key: 'month', label: t('home.range.month') },
    ],
    [t],
  )

  const loadEquipments = useCallback(async () => {
    setLoadErr('')
    setLoading(true)
    try {
      const data = await fetchEquipments({ page: 1, size: 999 })
      const list = data?.list ?? []
      setEquipments(list)
      setEqValue((prev) => {
        if (prev.length && list.some((e) => e.uid === prev[0])) return prev
        return list[0] ? [list[0].uid] : []
      })
    } catch (e) {
      setLoadErr(e.message || t('home.loadEquipFail'))
      Toast.show({ icon: 'fail', content: e.message })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadEquipments()
  }, [loadEquipments])

  const selected = useMemo(() => {
    const id = eqValue[0]
    return equipments.find((e) => e.uid === id) ?? null
  }, [eqValue, equipments])

  const ngPieData = useMemo(() => {
    if (!ngStatisticalData) return []
    const rows =
      rangeKey === 'today'
        ? ngStatisticalData.today
        : rangeKey === 'week'
          ? ngStatisticalData.week
          : ngStatisticalData.month
    return buildNgPieSlicesFromStatisticalRows(rows, t)
  }, [ngStatisticalData, rangeKey, t])

  const loadStatsAndImages = useCallback(async () => {
    if (!selected?.snCode || !selected?.uid) {
      setStats(null)
      setSwiperUrls([])
      setNgStatisticalData(null)
      setStatsLoading(false)
      return
    }
    setStatsLoading(true)
    setStats(null)
    setSwiperUrls([])
    setNgStatisticalData(null)
    const rangeFn = RANGE_FNS[rangeKey] ?? rangeToday
    const { start, end } = rangeFn()

    try {
      const [statsResult, statResult, ngResult] = await Promise.allSettled([
        fetchDefectStatistics({
          snCode: selected.snCode,
          startTime: start,
          endTime: end,
        }),
        fetchNgReasonStatistical({ equipmentId: selected.uid }),
        fetchNgRecords({ equipmentId: selected.uid, page: 1, size: 8 }),
      ])

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
      } else {
        Toast.show({ icon: 'fail', content: statsResult.reason?.message ?? t('home.statFail') })
        setStats(null)
      }

      if (statResult.status === 'fulfilled') {
        const d = statResult.value
        setNgStatisticalData({
          today: d.todayNgReasonStatistical ?? [],
          week: d.thisWeekNgReasonStatistical ?? [],
          month: d.thisMonthNgReasonStatistical ?? [],
        })
      } else {
        Toast.show({ icon: 'fail', content: statResult.reason?.message ?? t('home.ngStatFail') })
        setNgStatisticalData(null)
      }

      if (ngResult.status === 'fulfilled') {
        const ng = ngResult.value
        const urls = (ng?.list ?? [])
          .map((r) => resolveImageUrl(r.imageUrl))
          .filter(Boolean)
        setSwiperUrls(urls)
      } else {
        setSwiperUrls([])
      }
    } finally {
      setStatsLoading(false)
    }
  }, [selected, rangeKey, t])

  useEffect(() => {
    loadStatsAndImages()
  }, [loadStatsAndImages])

  const eqColumns = useMemo(
    () => [
      equipments.map((e) => ({
        label: e.name,
        value: e.uid,
      })),
    ],
    [equipments],
  )

  if (loading && !equipments.length) {
    return (
      <div className="page-loading">
        <DotLoading color="primary" />
      </div>
    )
  }

  if (loadErr && !equipments.length) {
    return (
      <div className="page-pad">
        <ErrorBlock status="default" title={loadErr} description={t('home.checkNetwork')} />
        <Button color="primary" onClick={loadEquipments}>
          {t('home.retry')}
        </Button>
      </div>
    )
  }

  const openEquipmentPicker = () => {
    if (!equipments.length) {
      Toast.show({ content: t('home.noDevicePick') })
      return
    }
    setEqPickerVisible(true)
  }

  return (
    <div className="page home-page">
      <div className="page-pad home-page-pad">
        <Picker
          columns={eqColumns}
          visible={eqPickerVisible}
          onClose={() => setEqPickerVisible(false)}
          onCancel={() => setEqPickerVisible(false)}
          value={eqValue}
          onConfirm={(v) => {
            setEqValue(v)
            setEqPickerVisible(false)
          }}
          title={t('home.selectDevice')}
        >
          {() => null}
        </Picker>

        <Card
          title={t('home.deviceOverview')}
          className={`block-card device-overview-card${equipments.length ? ' device-overview-card--active' : ''}`}
          extra={
            <div className="device-overview-card-extra" onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                color="primary"
                fill="outline"
                onClick={() => loadEquipments().then(loadStatsAndImages)}
              >
                {t('home.refresh')}
              </Button>
              {equipments.length ? (
                <button type="button" className="device-overview-extra" onClick={openEquipmentPicker}>
                  {t('home.switch')} <RightOutline />
                </button>
              ) : null}
            </div>
          }
          onClick={equipments.length ? openEquipmentPicker : undefined}
        >
          {selected ? (
            <div className="device-overview-tiles">
              <div className="device-overview-tile device-overview-tile--machine">
                <div className="device-overview-tile-kicker">{t('home.deviceLabel')}</div>
                <div className="device-overview-tile-title">{selected.name || '—'}</div>
                <Space wrap className="device-overview-tile-tags">
                  <Tag color={selected.online ? 'success' : 'default'}>
                    {selected.online ? t('home.online') : t('home.offline')}
                  </Tag>
                  <Tag color={selected.vpnStatus === 'ON' ? 'primary' : 'default'}>
                    VPN {selected.vpnStatus === 'ON' ? t('home.vpnOn') : t('home.vpnOff')}
                  </Tag>
                </Space>
              </div>
              <div className="device-overview-tile device-overview-tile--speed">
                <div className="device-overview-speed-row">
                  <img
                    src={fanIcon}
                    alt=""
                    className="device-overview-fan-icon"
                    width={28}
                    height={28}
                    decoding="async"
                  />
                  <span className="device-overview-tile-kicker device-overview-speed-label">
                    {t('home.speed')}
                  </span>
                </div>
                <div className="device-overview-speed-num">
                  {formatSpeedDecimals(selected.others?.speed ?? 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="muted">{t('home.noDevice')}</div>
          )}
        </Card>

        <Card title={t('home.defectAlarm')} className="block-card">
          {!selected ? (
            <div className="muted chart-placeholder">{t('home.selectDeviceFirst')}</div>
          ) : statsLoading ? (
            <div className="chart-placeholder home-inline-loading">
              <DotLoading color="primary" />
            </div>
          ) : swiperUrls.length ? (
            <Swiper loop autoplay autoplayInterval={4000} indicatorProps={{ color: 'white' }}>
              {swiperUrls.map((src, i) => (
                <Swiper.Item key={`${src}-${i}`}>
                  <div
                    className="defect-swiper-img-tap"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (src) ImageViewer.show({ image: src, maxZoom: 5 })
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        if (src) ImageViewer.show({ image: src, maxZoom: 5 })
                      }
                    }}
                  >
                    <Image src={src} fit="contain" className="defect-swiper-img" />
                  </div>
                </Swiper.Item>
              ))}
            </Swiper>
          ) : (
            <div className="muted chart-placeholder">{t('home.noDefectImages')}</div>
          )}
        </Card>

        <Card
          title={t('home.defectCount')}
          className="block-card defect-count-card"
          extra={
            <div className="defect-count-card-extra-tabs" onClick={(e) => e.stopPropagation()}>
              <CapsuleTabs activeKey={rangeKey} onChange={setRangeKey}>
                {rangeTabs.map((tab) => (
                  <CapsuleTabs.Tab title={tab.label} key={tab.key} />
                ))}
              </CapsuleTabs>
            </div>
          }
        >
          <div className="stat-total">
            <div className="stat-total-label">{t('home.totalDefects')}</div>
            <div className="stat-total-num">
              {statsLoading && selected ? (
                <DotLoading color="white" />
              ) : (
                <>
                  {stats
                    ? (stats.stopNgDataCount ?? 0) + (stats.normalNgDataCount ?? 0)
                    : '—'}
                  <span className="unit">{t('home.unit')}</span>
                </>
              )}
            </div>
          </div>
          <Space direction="vertical" block style={{ marginTop: 12 }}>
            <div className="stat-bar-row">
              <span>{t('home.nonStopDefects')}</span>
              <span className="stat-bar-val warn">
                {statsLoading && selected ? '—' : stats?.stopNgDataCount ?? '—'}
              </span>
            </div>
            <div className="stat-bar-row">
              <span>{t('home.stopDefects')}</span>
              <span className="stat-bar-val danger">
                {statsLoading && selected ? '—' : stats?.normalNgDataCount ?? '—'}
              </span>
            </div>
          </Space>
        </Card>

        <Card title={t('home.defectTypeChart')} className="block-card">
          {!selected ? (
            <div className="muted chart-placeholder">{t('home.selectDeviceFirst')}</div>
          ) : statsLoading ? (
            <div className="chart-placeholder home-inline-loading home-ng-pie-loading">
              <DotLoading color="primary" />
            </div>
          ) : ngPieData.length === 0 ? (
            <div className="muted chart-placeholder">{t('home.noChartData')}</div>
          ) : (
            <div className="home-ng-pie-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={ngPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={1}
                  >
                    {ngPieData.map((row, i) => (
                      <Cell key={`${row.code}-${i}`} fill={ngPieSliceColor(row)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [t('home.pieTooltip', { count: v }), t('home.countLabel')]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="home-ng-pie-legend">
                {ngPieData.map((row, i) => (
                  <li key={`${row.code}-${i}`}>
                    <span className="home-ng-pie-dot" style={{ background: ngPieSliceColor(row) }} />
                    <span className="home-ng-pie-legend-name">{row.name}</span>
                    <span className="home-ng-pie-legend-val">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
