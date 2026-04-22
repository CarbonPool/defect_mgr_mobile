import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Dialog,
  Empty,
  ImageViewer,
  InfiniteScroll,
  Picker,
  Popup,
  PullToRefresh,
  SearchBar,
  Selector,
  Space,
  Tag,
  Toast,
} from 'antd-mobile'
import { fetchEquipments } from '../api/equipments'
import { fetchProjects } from '../api/projects'
import { fetchNgRecords } from '../api/defect'
import { resolveImageUrl } from '../utils/assetUrl'
import { formatNgReasonDisplay, NG_REASON_FILTER_OPTIONS } from '../utils/ngReason'

const STOP_FILTER = [
  { label: '全部', value: 'all' },
  { label: '停机', value: 'stop' },
  { label: '不停机', value: 'run' },
]

function applyClientFilters(list, { keyword, stopFilter }) {
  return list.filter((r) => {
    if (keyword) {
      const k = keyword.trim().toLowerCase()
      const reasonText = formatNgReasonDisplay(r.ngReason)
      const hay = `${r.snCode}${r.productionCode}${r.ngReason}${reasonText}${r.operatorId}`.toLowerCase()
      if (!hay.includes(k)) return false
    }
    if (stopFilter === 'stop' && !r.isStop) return false
    if (stopFilter === 'run' && r.isStop) return false
    return true
  })
}

export default function DefectList() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState([])
  const [equipments, setEquipments] = useState([])
  const [equipmentId, setEquipmentId] = useState([])
  const [projPickerVisible, setProjPickerVisible] = useState(false)
  const [eqPickerVisible, setEqPickerVisible] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [stopFilter, setStopFilter] = useState('all')
  const [draftStop, setDraftStop] = useState('all')
  /** 缺陷原因：与接口 `key` 一致，空字符串表示不按原因筛选 */
  const [ngReasonKey, setNgReasonKey] = useState('')
  const [draftNgReason, setDraftNgReason] = useState('')
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const pid = projectId[0]
  const eid = equipmentId[0]

  const projectColumns = useMemo(
    () => [
      projects.map((p) => ({
        label: `${p.name}（${p.code}）`,
        value: p.uid,
      })),
    ],
    [projects],
  )

  const equipmentColumns = useMemo(
    () => [
      equipments.map((e) => ({
        label: e.name,
        value: e.uid,
      })),
    ],
    [equipments],
  )

  const loadMeta = useCallback(async () => {
    const pdata = await fetchProjects(1, 200)
    const plist = pdata?.list ?? []
    setProjects(plist)
    setProjectId((prev) => {
      if (prev.length && plist.some((p) => p.uid === prev[0])) return prev
      return plist[0] ? [plist[0].uid] : []
    })
  }, [])

  const loadEquipments = useCallback(async () => {
    if (!pid) {
      setEquipments([])
      setEquipmentId([])
      return
    }
    const data = await fetchEquipments({ projectId: pid, page: 1, size: 999 })
    const listEq = data?.list ?? []
    setEquipments(listEq)
    setEquipmentId((prev) => {
      if (prev.length && listEq.some((e) => e.uid === prev[0])) return prev
      return listEq[0] ? [listEq[0].uid] : []
    })
  }, [pid])

  useEffect(() => {
    loadMeta().catch((e) => Toast.show({ icon: 'fail', content: e.message }))
  }, [loadMeta])

  useEffect(() => {
    loadEquipments().catch((e) => Toast.show({ icon: 'fail', content: e.message }))
  }, [loadEquipments])

  const resetAndLoad = useCallback(async () => {
    if (!eid) {
      setList([])
      setHasMore(false)
      return
    }
    setPage(1)
    setHasMore(true)
    try {
      const data = await fetchNgRecords({
        equipmentId: eid,
        page: 1,
        size: 15,
        key: ngReasonKey || undefined,
      })
      const rows = data?.list ?? []
      setList(rows)
      const total = data?.totalCount ?? 0
      setHasMore(rows.length < total)
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message })
      setList([])
      setHasMore(false)
    }
  }, [eid, ngReasonKey])

  useEffect(() => {
    resetAndLoad()
  }, [resetAndLoad])

  const loadMore = async () => {
    if (!eid || !hasMore || loadingMore) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const data = await fetchNgRecords({
        equipmentId: eid,
        page: next,
        size: 15,
        key: ngReasonKey || undefined,
      })
      const rows = data?.list ?? []
      const total = data?.totalCount ?? 0
      let mergedLength = 0
      setList((prev) => {
        const merged = [...prev, ...rows]
        mergedLength = merged.length
        return merged
      })
      setHasMore(mergedLength < total)
      setPage(next)
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message })
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const filtered = useMemo(
    () => applyClientFilters(list, { keyword, stopFilter }),
    [list, keyword, stopFilter],
  )

  const openProjectPicker = () => {
    if (!projects.length) {
      Toast.show({ content: '暂无项目可选' })
      return
    }
    setProjPickerVisible(true)
  }

  const openEquipmentPicker = () => {
    if (!equipments.length) {
      Toast.show({ content: '当前项目下暂无设备' })
      return
    }
    setEqPickerVisible(true)
  }

  const openTextDetail = (row) => {
    Dialog.show({
      title: '缺陷详情',
      content: (
        <div className="detail-dialog">
          <div>
            <strong>SN</strong> {row.snCode}
          </div>
          <div>
            <strong>摄像头</strong> {row.cameraNumber}
          </div>
          <div>
            <strong>生产编号</strong> {row.productionCode}
          </div>
          <div>
            <strong>工人编号</strong> {row.operatorId}
          </div>
          <div>
            <strong>缺陷原因</strong> {formatNgReasonDisplay(row.ngReason) || '—'}
          </div>
          <div>
            <strong>停机类型</strong> {row.stopType}
          </div>
          <div>
            <strong>时间</strong> {row.startTime}
          </div>
        </div>
      ),
      closeOnAction: true,
      actions: [{ key: 'close', text: '关闭' }],
    })
  }

  const openDetail = (row) => {
    const img = resolveImageUrl(row.imageUrl)
    if (img) {
      ImageViewer.show({
        image: img,
        maxZoom: 5,
        renderFooter: () => (
          <div className="defect-image-viewer-footer">
            <div className="defect-image-viewer-title">{formatNgReasonDisplay(row.ngReason) || '缺陷图'}</div>
            <div className="defect-image-viewer-meta">
              <span>{row.startTime}</span>
              <span className="defect-image-viewer-dot">·</span>
              <span>{row.isStop ? '停机' : '不停机'}</span>
            </div>
            <div className="defect-image-viewer-sn">SN {row.snCode}</div>
            <Button
              size="small"
              fill="outline"
              color="primary"
              className="defect-image-viewer-more"
              onClick={() => {
                ImageViewer.clear()
                openTextDetail(row)
              }}
            >
              查看全部信息
            </Button>
          </div>
        ),
      })
    } else {
      openTextDetail(row)
    }
  }

  return (
    <div className="page defect-page defect-page--layout">
      <div className="defect-page-toolbar">
        <div className="defect-toolbar-search-row">
          <SearchBar
            className="defect-search-bar-main"
            placeholder="搜索 SN / 生产编号 / 缺陷原因"
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
          <Button
            className="defect-toolbar-filter-btn"
            color="primary"
            fill="outline"
            onClick={() => {
              setDraftStop(stopFilter)
              setDraftKeyword(keyword)
              setDraftNgReason(ngReasonKey)
              setFilterOpen(true)
            }}
          >
            筛选
          </Button>
        </div>

        <Picker
          columns={projectColumns}
          visible={projPickerVisible}
          onClose={() => setProjPickerVisible(false)}
          onCancel={() => setProjPickerVisible(false)}
          value={projectId}
          onConfirm={(v) => {
            setProjectId(v)
            setProjPickerVisible(false)
          }}
          title="所属项目"
        >
          {() => null}
        </Picker>
        <Picker
          columns={equipmentColumns}
          visible={eqPickerVisible}
          onClose={() => setEqPickerVisible(false)}
          onCancel={() => setEqPickerVisible(false)}
          value={equipmentId}
          onConfirm={(v) => {
            setEquipmentId(v)
            setEqPickerVisible(false)
          }}
          title="设备"
        >
          {() => null}
        </Picker>

        <div className="defect-toolbar-picks-row">
          <Button className="defect-pick-btn defect-pick-btn--project" fill="outline" onClick={openProjectPicker}>
            <span className="defect-pick-btn__k">项目</span>
            <span className="defect-pick-btn__v">{projects.find((p) => p.uid === pid)?.name ?? '选择'}</span>
          </Button>
          <Button
            className="defect-pick-btn defect-pick-btn--equipment"
            color="primary"
            fill="solid"
            disabled={!equipments.length}
            onClick={openEquipmentPicker}
          >
            <span className="defect-pick-btn__k">设备</span>
            <span className="defect-pick-btn__v">{equipments.find((e) => e.uid === eid)?.name ?? '选择'}</span>
          </Button>
        </div>
      </div>

      <div className="defect-page-list-scroll">
        <PullToRefresh onRefresh={resetAndLoad}>
          <div className="defect-page-list-pad">
            <div className="list-stack">
              {!filtered.length ? (
                <Empty description="暂无记录" />
              ) : (
                filtered.map((row) => (
                  <Card key={row.uid} className="record-card" onClick={() => openDetail(row)}>
                    <div className="record-head">
                      <span className="record-title">{formatNgReasonDisplay(row.ngReason) || '—'}</span>
                      <Tag color={row.isStop ? 'danger' : 'success'}>{row.isStop ? '停机' : '不停机'}</Tag>
                    </div>
                    <div className="record-meta muted">SN {row.snCode}</div>
                    <div className="record-meta muted">摄像头 {row.cameraNumber}</div>
                    <div className="record-meta muted">生产编号 {row.productionCode}</div>
                    <div className="record-meta muted">工人编号 {row.operatorId || '—'}</div>
                    <div className="record-foot">
                      <span className="muted">{row.startTime}</span>
                      <Button size="mini" color="primary" fill="none" onClick={(ev) => { ev.stopPropagation(); openDetail(row); }}>
                        查看
                      </Button>
                    </div>
                  </Card>
                ))
              )}
              <InfiniteScroll loadMore={loadMore} hasMore={hasMore && !!eid} />
            </div>
          </div>
        </PullToRefresh>
      </div>

      <Popup
        visible={filterOpen}
        onMaskClick={() => setFilterOpen(false)}
        position="bottom"
        bodyClassName="defect-filter-popup-body"
        bodyStyle={{
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          padding: 16,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <div className="defect-filter-popup-inner">
          <div className="filter-popup-title">更多筛选</div>
          <div className="muted filter-hint">
            缺陷原因由接口 key 筛选并分页；停机状态与关键字在已加载数据中本地过滤。
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">缺陷原因</div>
            <Selector
              columns={2}
              options={NG_REASON_FILTER_OPTIONS}
              value={[draftNgReason]}
              onChange={(arr) => setDraftNgReason(arr[0] ?? '')}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">停机状态</div>
            <Selector
              columns={3}
              options={STOP_FILTER}
              value={[draftStop]}
              onChange={(arr) => setDraftStop(arr[0])}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">关键字（本地）</div>
            <SearchBar
              className="defect-search-bar-popup"
              placeholder="与上方搜索栏同步逻辑"
              value={draftKeyword}
              onChange={setDraftKeyword}
              style={{
                '--background': '#f0f4fa',
                '--border-radius': '10px',
                '--height': '38px',
                '--padding-left': '12px',
                '--placeholder-color': '#999',
              }}
            />
          </div>
          <Space block direction="vertical" style={{ marginTop: 16, width: '100%' }}>
            <Button
              block
              color="primary"
              onClick={() => {
                setNgReasonKey(draftNgReason)
                setStopFilter(draftStop)
                setKeyword(draftKeyword)
                setFilterOpen(false)
              }}
            >
              应用
            </Button>
            <Button
              block
              fill="outline"
              onClick={() => {
                setDraftStop('all')
                setDraftKeyword('')
                setDraftNgReason('')
                setStopFilter('all')
                setKeyword('')
                setNgReasonKey('')
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </Popup>
    </div>
  )
}
