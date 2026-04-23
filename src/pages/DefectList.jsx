import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Dialog,
  DotLoading,
  Empty,
  ImageViewer,
  InfiniteScroll,
  Picker,
  Popup,
  PullToRefresh,
  SearchBar,
  Selector,
  Tag,
  Toast,
} from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { fetchEquipments } from '../api/equipments'
import { fetchProjects } from '../api/projects'
import { fetchNgRecords } from '../api/defect'
import { endOfDayMs, startOfDayMs } from '../api/timeRange'
import { resolveImageUrl } from '../utils/assetUrl'
import { formatNgReasonDisplay, getNgReasonFilterOptions } from '../utils/ngReason'

function formatYmd(d) {
  if (!d) return ''
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function applyClientFilters(list, { keyword, stopFilter, t }) {
  return list.filter((r) => {
    if (keyword) {
      const k = keyword.trim().toLowerCase()
      const reasonText = formatNgReasonDisplay(r.ngReason, t)
      const hay = `${r.snCode}${r.productionCode}${r.ngReason}${reasonText}${r.operatorId}`.toLowerCase()
      if (!hay.includes(k)) return false
    }
    if (stopFilter === 'stop' && !r.isStop) return false
    if (stopFilter === 'run' && r.isStop) return false
    return true
  })
}

export default function DefectList() {
  const { t } = useTranslation()
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
  const [ngReasonKey, setNgReasonKey] = useState('')
  const [draftNgReason, setDraftNgReason] = useState('')
  const [timeStartMs, setTimeStartMs] = useState(null)
  const [timeEndMs, setTimeEndMs] = useState(null)
  const [draftTimeStart, setDraftTimeStart] = useState(null)
  const [draftTimeEnd, setDraftTimeEnd] = useState(null)
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [metaLoaded, setMetaLoaded] = useState(false)
  const [equipLoaded, setEquipLoaded] = useState(false)

  const pid = projectId[0]
  const eid = equipmentId[0]
  const showListLoader = !metaLoaded || !equipLoaded || (!!eid && listLoading)

  const stopFilterOptions = useMemo(
    () => [
      { label: t('defects.filterAll'), value: 'all' },
      { label: t('defects.filterStop'), value: 'stop' },
      { label: t('defects.filterRun'), value: 'run' },
    ],
    [t],
  )

  const ngReasonOptions = useMemo(() => getNgReasonFilterOptions(t), [t])

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
    try {
      const pdata = await fetchProjects(1, 200)
      const plist = pdata?.list ?? []
      setProjects(plist)
      setProjectId((prev) => {
        if (prev.length && plist.some((p) => p.uid === prev[0])) return prev
        return plist[0] ? [plist[0].uid] : []
      })
    } finally {
      setMetaLoaded(true)
    }
  }, [])

  const loadEquipments = useCallback(async () => {
    setEquipLoaded(false)
    if (!pid) {
      setEquipments([])
      setEquipmentId([])
      setEquipLoaded(true)
      return
    }
    try {
      const data = await fetchEquipments({ projectId: pid, page: 1, size: 999 })
      const listEq = data?.list ?? []
      setEquipments(listEq)
      setEquipmentId((prev) => {
        if (prev.length && listEq.some((e) => e.uid === prev[0])) return prev
        return listEq[0] ? [listEq[0].uid] : []
      })
    } catch (e) {
      setEquipments([])
      setEquipmentId([])
      throw e
    } finally {
      setEquipLoaded(true)
    }
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
      setListLoading(false)
      return
    }
    setListLoading(true)
    setList([])
    setPage(1)
    setHasMore(true)
    try {
      const data = await fetchNgRecords({
        equipmentId: eid,
        page: 1,
        size: 15,
        key: ngReasonKey || undefined,
        startTime: timeStartMs ?? undefined,
        endTime: timeEndMs ?? undefined,
      })
      const rows = data?.list ?? []
      setList(rows)
      const total = data?.totalCount ?? 0
      setHasMore(rows.length < total)
    } catch (e) {
      Toast.show({ icon: 'fail', content: e.message })
      setList([])
      setHasMore(false)
    } finally {
      setListLoading(false)
    }
  }, [eid, ngReasonKey, timeStartMs, timeEndMs])

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
        startTime: timeStartMs ?? undefined,
        endTime: timeEndMs ?? undefined,
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
    () => applyClientFilters(list, { keyword, stopFilter, t }),
    [list, keyword, stopFilter, t],
  )

  const openProjectPicker = () => {
    if (!projects.length) {
      Toast.show({ content: t('defects.noProject') })
      return
    }
    setProjPickerVisible(true)
  }

  const openEquipmentPicker = () => {
    if (!equipments.length) {
      Toast.show({ content: t('defects.noEquipmentInProject') })
      return
    }
    setEqPickerVisible(true)
  }

  const openTextDetail = useCallback(
    (row) => {
      Dialog.show({
        title: t('defects.detailTitle'),
        content: (
          <div className="detail-dialog">
            <div>
              <strong>{t('defects.sn')}</strong> {row.snCode}
            </div>
            <div>
              <strong>{t('defects.camera')}</strong> {row.cameraNumber}
            </div>
            <div>
              <strong>{t('defects.productionNo')}</strong> {row.productionCode}
            </div>
            <div>
              <strong>{t('defects.workerNo')}</strong> {row.operatorId}
            </div>
            <div>
              <strong>{t('defects.ngReason')}</strong> {formatNgReasonDisplay(row.ngReason, t) || '—'}
            </div>
            <div>
              <strong>{t('defects.stopType')}</strong> {row.stopType}
            </div>
            <div>
              <strong>{t('defects.time')}</strong> {row.startTime}
            </div>
          </div>
        ),
        closeOnAction: true,
        actions: [{ key: 'close', text: t('defects.close') }],
      })
    },
    [t],
  )

  const openDetail = (row) => {
    const img = resolveImageUrl(row.imageUrl)
    if (img) {
      ImageViewer.show({
        image: img,
        maxZoom: 5,
        renderFooter: () => (
          <div className="defect-image-viewer-footer">
            <div className="defect-image-viewer-title">
              {formatNgReasonDisplay(row.ngReason, t) || t('defects.defectImage')}
            </div>
            <div className="defect-image-viewer-meta">
              <span>{row.startTime}</span>
              <span className="defect-image-viewer-dot">·</span>
              <span>{row.isStop ? t('defects.stop') : t('defects.run')}</span>
            </div>
            <div className="defect-image-viewer-sn">
              {t('defects.sn')} {row.snCode}
            </div>
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
              {t('defects.viewAll')}
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
            placeholder={t('defects.searchPlaceholder')}
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
              setDraftTimeStart(timeStartMs != null ? new Date(timeStartMs) : null)
              setDraftTimeEnd(timeEndMs != null ? new Date(timeEndMs) : null)
              setFilterOpen(true)
            }}
          >
            {t('defects.filter')}
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
          title={t('defects.pickerProject')}
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
          title={t('defects.pickerEquipment')}
        >
          {() => null}
        </Picker>

        <div className="defect-toolbar-picks-row">
          <Button className="defect-pick-btn defect-pick-btn--project" fill="outline" onClick={openProjectPicker}>
            <span className="defect-pick-btn__k">{t('defects.project')}</span>
            <span className="defect-pick-btn__v">{projects.find((p) => p.uid === pid)?.name ?? t('defects.select')}</span>
          </Button>
          <Button
            className="defect-pick-btn defect-pick-btn--equipment"
            color="primary"
            fill="solid"
            disabled={!equipments.length}
            onClick={openEquipmentPicker}
          >
            <span className="defect-pick-btn__k">{t('defects.equipment')}</span>
            <span className="defect-pick-btn__v">{equipments.find((e) => e.uid === eid)?.name ?? t('defects.select')}</span>
          </Button>
        </div>
      </div>

      <div className="defect-page-list-scroll">
        <PullToRefresh onRefresh={resetAndLoad}>
          <div className="defect-page-list-pad">
            <div className="list-stack">
              {showListLoader ? (
                <div className="defect-list-body-loading">
                  <DotLoading color="primary" />
                </div>
              ) : !filtered.length ? (
                <Empty description={t('defects.empty')} />
              ) : (
                filtered.map((row) => (
                  <Card key={row.uid} className="record-card" onClick={() => openDetail(row)}>
                    <div className="record-head">
                      <span className="record-title">{formatNgReasonDisplay(row.ngReason, t) || '—'}</span>
                      <Tag color={row.isStop ? 'danger' : 'success'}>
                        {row.isStop ? t('defects.stop') : t('defects.run')}
                      </Tag>
                    </div>
                    <div className="record-meta muted">
                      {t('defects.sn')} {row.snCode}
                    </div>
                    <div className="record-meta muted">
                      {t('defects.camera')} {row.cameraNumber}
                    </div>
                    <div className="record-meta muted">
                      {t('defects.productionNo')} {row.productionCode}
                    </div>
                    <div className="record-meta muted">
                      {t('defects.workerNo')} {row.operatorId || '—'}
                    </div>
                    <div className="record-foot">
                      <span className="muted">{row.startTime}</span>
                      <Button
                        size="mini"
                        color="primary"
                        fill="none"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          openDetail(row)
                        }}
                      >
                        {t('defects.view')}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
              {!showListLoader && !!eid && filtered.length > 0 && (
                <InfiniteScroll
                  loadMore={loadMore}
                  hasMore={hasMore && !listLoading}
                />
              )}
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
          <div className="filter-popup-title">{t('defects.moreFilters')}</div>
          <div className="defect-filter-time-row" style={{ marginTop: 12 }}>
            <div className="defect-filter-time-col">
              <div className="filter-label-row">
                <div className="filter-label">{t('defects.timeStart')}</div>
                {draftTimeStart ? (
                  <span className="filter-time-clear" onClick={() => setDraftTimeStart(null)} role="presentation">
                    {t('defects.clearTime')}
                  </span>
                ) : null}
              </div>
              <DatePicker
                value={draftTimeStart}
                onConfirm={setDraftTimeStart}
                precision="day"
                max={draftTimeEnd || new Date()}
                title={t('defects.timeStart')}
              >
                {(v, a) => (
                  <Button block fill="outline" className="defect-date-filter-btn" onClick={a.open}>
                    {v ? formatYmd(v) : t('defects.timeNoLimit')}
                  </Button>
                )}
              </DatePicker>
            </div>
            <div className="defect-filter-time-col">
              <div className="filter-label-row">
                <div className="filter-label">{t('defects.timeEnd')}</div>
                {draftTimeEnd ? (
                  <span className="filter-time-clear" onClick={() => setDraftTimeEnd(null)} role="presentation">
                    {t('defects.clearTime')}
                  </span>
                ) : null}
              </div>
              <DatePicker
                value={draftTimeEnd}
                onConfirm={setDraftTimeEnd}
                precision="day"
                min={draftTimeStart || undefined}
                max={new Date()}
                title={t('defects.timeEnd')}
              >
                {(v, a) => (
                  <Button block fill="outline" className="defect-date-filter-btn" onClick={a.open}>
                    {v ? formatYmd(v) : t('defects.timeNoLimit')}
                  </Button>
                )}
              </DatePicker>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">{t('defects.ngReason')}</div>
            <Selector
              columns={3}
              options={ngReasonOptions}
              value={[draftNgReason]}
              onChange={(arr) => setDraftNgReason(arr[0] ?? '')}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">{t('defects.stopState')}</div>
            <Selector
              columns={3}
              options={stopFilterOptions}
              value={[draftStop]}
              onChange={(arr) => setDraftStop(arr[0])}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="filter-label">{t('defects.keywordLocal')}</div>
            <SearchBar
              className="defect-search-bar-popup"
              placeholder={t('defects.searchPlaceholder')}
              value={draftKeyword}
              onChange={setDraftKeyword}
              style={{
                '--background': '#f0f4fa',
                '--border-radius': '10px',
                '--height': '38px',
                '--padding-left': '12px',
                '--placeholder-color': '#8c8c8c',
              }}
            />
          </div>
          <div className="defect-filter-actions">
            <Button
              className="defect-filter-action-btn"
              color="primary"
              onClick={() => {
                const s = draftTimeStart ? startOfDayMs(draftTimeStart) : null
                const e = draftTimeEnd ? endOfDayMs(draftTimeEnd) : null
                if (s != null && e != null && e < s) {
                  Toast.show({ content: t('defects.timeRangeInvalid') })
                  return
                }
                setTimeStartMs(s)
                setTimeEndMs(e)
                setNgReasonKey(draftNgReason)
                setStopFilter(draftStop)
                setKeyword(draftKeyword)
                setFilterOpen(false)
              }}
            >
              {t('defects.apply')}
            </Button>
            <Button
              className="defect-filter-action-btn"
              fill="outline"
              onClick={() => {
                setDraftStop('all')
                setDraftKeyword('')
                setDraftNgReason('')
                setDraftTimeStart(null)
                setDraftTimeEnd(null)
                setTimeStartMs(null)
                setTimeEndMs(null)
                setStopFilter('all')
                setKeyword('')
                setNgReasonKey('')
              }}
            >
              {t('defects.reset')}
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}
