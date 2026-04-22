import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  CapsuleTabs,
  Card,
  DotLoading,
  ErrorBlock,
  Image,
  Picker,
  Space,
  Swiper,
  Tag,
  Toast,
} from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchEquipments } from '../api/equipments'
import { fetchDefectStatistics, fetchNgReasonStatistical, fetchNgRecords } from '../api/defect'
import { rangeThisMonth, rangeThisWeek, rangeToday } from '../api/timeRange'
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

const RANGE_KEYS = [
  { key: 'today', label: '今日', fn: rangeToday },
  { key: 'week', label: '本周', fn: rangeThisWeek },
  { key: 'month', label: '本月', fn: rangeThisMonth },
]

export default function Home() {
  const [equipments, setEquipments] = useState([])
  const [eqPickerVisible, setEqPickerVisible] = useState(false)
  const [eqValue, setEqValue] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [rangeKey, setRangeKey] = useState('today')
  const [swiperUrls, setSwiperUrls] = useState([])
  /** 统计接口一次返回今日/周/月，饼图按 rangeKey 取用 */
  const [ngStatisticalData, setNgStatisticalData] = useState(null)
  const [loadErr, setLoadErr] = useState('')

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
      setLoadErr(e.message || '加载设备失败')
      Toast.show({ icon: 'fail', content: e.message })
    } finally {
      setLoading(false)
    }
  }, [])

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
    return buildNgPieSlicesFromStatisticalRows(rows)
  }, [ngStatisticalData, rangeKey])

  const loadStatsAndImages = useCallback(async () => {
    if (!selected?.snCode || !selected?.uid) {
      setStats(null)
      setSwiperUrls([])
      setNgStatisticalData(null)
      return
    }
    const rangeFn = RANGE_KEYS.find((r) => r.key === rangeKey)?.fn ?? rangeToday
    const { start, end } = rangeFn()

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
      Toast.show({ icon: 'fail', content: statsResult.reason?.message ?? '缺陷统计失败' })
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
      Toast.show({ icon: 'fail', content: statResult.reason?.message ?? '缺陷类型统计失败' })
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
  }, [selected, rangeKey])

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
        <ErrorBlock status="default" title={loadErr} description="请检查网络或代理配置" />
        <Button color="primary" onClick={loadEquipments}>
          重试
        </Button>
      </div>
    )
  }

  const openEquipmentPicker = () => {
    if (!equipments.length) {
      Toast.show({ content: '暂无设备可选' })
      return
    }
    setEqPickerVisible(true)
  }

  return (
    <div className="page home-page">
      <div className="page-pad">
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
          title="选择设备"
        >
          {() => null}
        </Picker>

        <Card
          title="设备数据总览"
          className={`block-card device-overview-card${equipments.length ? ' device-overview-card--active' : ''}`}
          extra={
            <div className="device-overview-card-extra" onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                color="primary"
                fill="outline"
                onClick={() => loadEquipments().then(loadStatsAndImages)}
              >
                刷新
              </Button>
              {equipments.length ? (
                <button type="button" className="device-overview-extra" onClick={openEquipmentPicker}>
                  切换 <RightOutline />
                </button>
              ) : null}
            </div>
          }
          onClick={equipments.length ? openEquipmentPicker : undefined}
        >
          {selected ? (
            <div className="device-brief">
              <div>设备信息</div>
              <div className="device-brief-device">设备：{selected.name || '—'}</div>
              <div>
                转速：
                <strong>{selected.others?.speed ?? 0}</strong>
              </div>
              <Space style={{ marginTop: 8 }}>
                <Tag color={selected.online ? 'success' : 'default'}>
                  {selected.online ? '在线' : '离线'}
                </Tag>
                <Tag color={selected.vpnStatus === 'ON' ? 'primary' : 'default'}>
                  VPN {selected.vpnStatus === 'ON' ? '开' : '关'}
                </Tag>
              </Space>
            </div>
          ) : (
            <div className="muted">暂无设备</div>
          )}
        </Card>

        <Card title="缺陷报警" className="block-card">
          {swiperUrls.length ? (
            <Swiper loop autoplay autoplayInterval={4000} indicatorProps={{ color: 'white' }}>
              {swiperUrls.map((src, i) => (
                <Swiper.Item key={`${src}-${i}`}>
                  <Image src={src} fit="contain" className="defect-swiper-img" />
                </Swiper.Item>
              ))}
            </Swiper>
          ) : (
            <div className="muted chart-placeholder">暂无最近缺陷图片</div>
          )}
        </Card>

        <Card title="缺陷数量" className="block-card">
          <CapsuleTabs activeKey={rangeKey} onChange={setRangeKey}>
            {RANGE_KEYS.map((t) => (
              <CapsuleTabs.Tab title={t.label} key={t.key} />
            ))}
          </CapsuleTabs>
          <div className="stat-total">
            <div className="stat-total-label">缺陷总数</div>
            <div className="stat-total-num">
              {stats
                ? (stats.stopNgDataCount ?? 0) + (stats.normalNgDataCount ?? 0)
                : '—'}
              <span className="unit">个</span>
            </div>
          </div>
          <Space direction="vertical" block style={{ marginTop: 12 }}>
            <div className="stat-bar-row">
              <span>不停机缺陷</span>
              <span className="stat-bar-val warn">{stats?.stopNgDataCount ?? '—'}</span>
            </div>
            <div className="stat-bar-row">
              <span>停机缺陷</span>
              <span className="stat-bar-val danger">{stats?.normalNgDataCount ?? '—'}</span>
            </div>
          </Space>
        </Card>

        <Card title="缺陷类型分布" className="block-card">
          {!selected ? (
            <div className="muted chart-placeholder">请先选择设备</div>
          ) : ngPieData.length === 0 ? (
            <div className="muted chart-placeholder">暂无分项数据</div>
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
                  <Tooltip formatter={(v) => [`${v} 条`, '数量']} />
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
