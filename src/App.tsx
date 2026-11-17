import { useState } from 'react';
import LandingPage from './LandingPage';
import SmartphoneSuite, {
  ActionSubTool,
  ForecastSubMode,
  SmartphoneMainTab,
} from './SmartphoneSuite';
import FootwearApp from './FootwearApp';

type SuiteRoute = 'landing' | 'smartphones' | 'footwear';

export function App() {
  const [route, setRoute] = useState<SuiteRoute>('landing');

  // Deep-link state for Smartphones Demo
  const [mobileTab, setMobileTab] =
    useState<SmartphoneMainTab>('city-explainer');
  const [mobileActionTool, setMobileActionTool] =
    useState<ActionSubTool>('whatsapp');
  const [mobileForecastMode, setMobileForecastMode] =
    useState<ForecastSubMode>('weekly');

  // Deep-link state for Footwear Demo
  const [footwearTab, setFootwearTab] = useState<
    'workspace' | 'coldstart' | 'routing' | 'connectors'
  >('workspace');

  const handleOpenSmartphoneDemo = (
    tab: SmartphoneMainTab = 'city-explainer',
    actionTool: ActionSubTool = 'whatsapp',
    forecastMode: ForecastSubMode = 'weekly'
  ) => {
    setMobileTab(tab);
    setMobileActionTool(actionTool);
    setMobileForecastMode(forecastMode);
    setRoute('smartphones');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFootwearDemo = (
    tab: 'workspace' | 'coldstart' | 'routing' | 'connectors' = 'workspace'
  ) => {
    setFootwearTab(tab);
    setRoute('footwear');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (route === 'smartphones') {
    return (
      <SmartphoneSuite
        onBackHome={() => setRoute('landing')}
        onSwitchToFootwear={() => handleOpenFootwearDemo('workspace')}
        initialTab={mobileTab}
        initialActionTool={mobileActionTool}
        initialForecastMode={mobileForecastMode}
      />
    );
  }

  if (route === 'footwear') {
    return (
      <FootwearApp
        onBackHome={() => setRoute('landing')}
        onSwitchToSmartphones={() => handleOpenSmartphoneDemo('city-explainer')}
        initialTab={footwearTab}
      />
    );
  }

  return (
    <LandingPage
      onOpenSmartphoneDemo={handleOpenSmartphoneDemo}
      onOpenFootwearDemo={handleOpenFootwearDemo}
    />
  );
}

export default App;
