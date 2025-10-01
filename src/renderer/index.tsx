/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import '@mantine/core/styles.css';
import './assets/index.css';

console.log(
  '👋 This message is being logged by "renderer.js", included via webpack',
);

import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const theme = createTheme({
  /** Put your mantine theme override here */
});

function App() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={700}>Engram</Text>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Text size="sm" fw={500}>Navigation</Text>
        </AppShell.Navbar>

        <AppShell.Main>
          <Text size="xl" fw={700} mb="md">Welcome to Engram</Text>
          <Text mb="md">Mantine has been successfully installed!</Text>
          <Button>Click me</Button>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

const root = createRoot(document.body);
root.render(<App />);
