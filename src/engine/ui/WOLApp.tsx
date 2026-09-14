import { useLifeStore } from '../store/lifeStore'
import { CreationScreen } from './CreationScreen'
import { MainGameScreen } from './MainGameScreen'
import './ui.css'

export function WOLApp() {
  const { phase } = useLifeStore()

  if (phase === 'creation') {
    return <CreationScreen />
  }

  return <MainGameScreen />
}
