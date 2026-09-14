import { useRef, useState } from 'react'
import { getActiveContent, resetToBasePack } from '../../../content/registry'
import {
  fetchPackCatalog,
  installCatalogEntry,
  installContentPackFromFile,
  installContentPackFromUrl,
  type LoadedPackResult,
} from '../../../content/loadPack'
import type { PackCatalogEntry } from '../../../content/packTypes'

type PackPanelProps = {
  onPackChanged?(): void
}

function formatLoaded(result: LoadedPackResult): string {
  const lines = [
    `已加载扩展：${result.pack.name} v${result.pack.version}`,
    `SHA-256：${result.integrity.sha256.slice(0, 16)}…`,
  ]
  if (result.integrity.hmacOk === true) lines.push('HMAC 签名：通过')
  if (result.integrity.hmacOk === false) lines.push('HMAC 签名：失败')
  if (result.integrity.warnings.length) {
    lines.push(...result.integrity.warnings.map((w) => `注意：${w}`))
  }
  if (result.pack.copyrightNotice) lines.push(result.pack.copyrightNotice)
  return lines.join('\n')
}

export function PackPanel({ onPackChanged }: PackPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remoteUrl, setRemoteUrl] = useState('/extensions/douluo-life.zip')
  const [requireSignature, setRequireSignature] = useState(false)
  const [catalog, setCatalog] = useState<PackCatalogEntry[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const active = getActiveContent()

  function loadCatalogOnDemand(open: boolean) {
    if (!open || catalogLoaded) return
    setCatalogLoaded(true)
    void fetchPackCatalog()
      .then((data) => {
        setCatalog(data.packs)
        setCatalogError(null)
      })
      .catch((error: unknown) => {
        setCatalog([])
        setCatalogError(error instanceof Error ? error.message : '目录加载失败')
      })
  }

  async function runInstall(task: () => Promise<LoadedPackResult>) {
    setBusy(true)
    setMessage(null)
    try {
      const result = await task()
      setMessage(formatLoaded(result))
      onPackChanged?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '扩展加载失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details
      className="pack-panel"
      onToggle={(event) => loadCatalogOnDemand(event.currentTarget.open)}
    >
      <summary>内容扩展</summary>
      <div className="pack-panel__body">
        <p>
          当前包：<strong>{active.packName}</strong>
          <span className="pack-panel__id">（{active.packId}）</span>
        </p>
        <p className="pack-panel__hint">
          默认内容为原创泛化世界观。可选 zip 扩展（本地 / 同源 URL / 目录）。
          安装时做结构校验与 SHA-256 校验。HMAC 仅作损坏检测，不能当作「已安全授权」。
          跨域远程 URL 默认禁止。含版权风险的主题包请勿随本仓库再分发。
        </p>

        <label className="pack-panel__check">
          <input
            type="checkbox"
            checked={requireSignature}
            onChange={(event) => setRequireSignature(event.target.checked)}
          />
          强制 HMAC 签名校验
        </label>

        <div className="pack-panel__actions">
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            加载本地 zip
          </button>
          <button
            type="button"
            disabled={busy || active.packId === 'base'}
            onClick={() => {
              resetToBasePack()
              setMessage('已恢复默认内容包')
              onPackChanged?.()
            }}
          >
            恢复默认
          </button>
        </div>

        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#0f172a',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
            onClick={() => {
              try {
                globalThis.localStorage?.setItem('wol_mode', '2')
              } catch {}
              globalThis.location?.reload()
            }}
          >
            ★ 体验 WOL 2.0 多世界命运轮盘（现代 / 武侠）
          </button>
        </div>

        <div className="pack-panel__remote">
          <input
            type="url"
            value={remoteUrl}
            onChange={(event) => setRemoteUrl(event.target.value)}
            placeholder="https://…/pack.zip 或 /extensions/xxx.zip"
            aria-label="远程扩展 URL"
          />
          <button
            type="button"
            disabled={busy || !remoteUrl.trim()}
            onClick={() => void runInstall(() => installContentPackFromUrl(remoteUrl.trim(), {
              requireSignature,
              strict: true,
            }))}
          >
            从 URL 加载
          </button>
        </div>

        {catalog.length > 0 ? (
          <div className="pack-panel__catalog">
            <p className="pack-panel__catalog-title">已知扩展目录</p>
            <ul>
              {catalog.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.name}</strong>
                    <span className="pack-panel__id">v{entry.version}</span>
                    {entry.description ? <p>{entry.description}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runInstall(() => installCatalogEntry(entry, {
                      requireSignature,
                      strict: true,
                    }))}
                  >
                    安装
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : catalogError ? (
          <p className="pack-panel__hint">扩展目录：{catalogError}</p>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void runInstall(() => installContentPackFromFile(file, {
                requireSignature,
                strict: true,
              }))
            }
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
        {message ? <pre className="pack-panel__msg">{message}</pre> : null}
      </div>
    </details>
  )
}
