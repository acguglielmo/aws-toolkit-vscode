/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

import * as vscode from 'vscode'
import * as nls from 'vscode-nls'

import { RegionNode } from './lambda/explorer/regionNode'
import { LambdaProvider } from './lambda/lambdaProvider'
import { NodeDebugConfigurationProvider } from './lambda/local/debugConfigurationProvider'
import { AWSClientBuilder } from './shared/awsClientBuilder'
import { AwsContextTreeCollection } from './shared/awsContextTreeCollection'
import { extensionSettingsPrefix } from './shared/constants'
import { DefaultCredentialsFileReaderWriter } from './shared/credentials/defaultCredentialsFileReaderWriter'
import { DefaultAwsContext } from './shared/defaultAwsContext'
import { DefaultAWSContextCommands } from './shared/defaultAwsContextCommands'
import { DefaultResourceFetcher } from './shared/defaultResourceFetcher'
import { EnvironmentVariables } from './shared/environmentVariables'
import { ext } from './shared/extensionGlobals'
import { safeGet } from './shared/extensionUtilities'
import { NpmPackage } from './shared/npmPackage'
import { DefaultRegionProvider } from './shared/regions/defaultRegionProvider'
import { DefaultSettingsConfiguration } from './shared/settingsConfiguration'
import { AWSStatusBar } from './shared/statusBar'

export async function activate(context: vscode.ExtensionContext) {

    const env = process.env as EnvironmentVariables
    if (!!env.VSCODE_NLS_CONFIG) {
        nls.config(JSON.parse(env.VSCODE_NLS_CONFIG) as nls.Options)()
    } else {
        nls.config()()
    }

    ext.lambdaOutputChannel = vscode.window.createOutputChannel('AWS Lambda')
    ext.context = context

    await new DefaultCredentialsFileReaderWriter().setCanUseConfigFileIfExists()

    const awsContext = new DefaultAwsContext(new DefaultSettingsConfiguration(extensionSettingsPrefix))
    const awsContextTrees = new AwsContextTreeCollection()
    const resourceFetcher = new DefaultResourceFetcher()
    const regionProvider = new DefaultRegionProvider(context, resourceFetcher)

    ext.awsContextCommands = new DefaultAWSContextCommands(awsContext, awsContextTrees, regionProvider)
    ext.sdkClientBuilder = new AWSClientBuilder(awsContext)
    ext.statusBar = new AWSStatusBar(awsContext, context)

    vscode.commands.registerCommand(
        'aws.mockups.validateDebugger',
        async () => await validateDebuggerIsInstalled('ruby')
    )
    vscode.commands.registerCommand('aws.login', async () => await ext.awsContextCommands.onCommandLogin())
    vscode.commands.registerCommand(
        'aws.credential.profile.create',
        async () => await ext.awsContextCommands.onCommandCreateCredentialsProfile()
    )
    vscode.commands.registerCommand('aws.logout', async () => await ext.awsContextCommands.onCommandLogout())

    vscode.commands.registerCommand(
        'aws.showRegion',
        async () => await ext.awsContextCommands.onCommandShowRegion()
    )
    vscode.commands.registerCommand(
        'aws.hideRegion',
        async (node?: RegionNode) => await ext.awsContextCommands.onCommandHideRegion(safeGet(node, x => x.regionCode))
    )

    const providers = [
        new LambdaProvider(awsContext, awsContextTrees, regionProvider, resourceFetcher)
    ]

    providers.forEach((p) => {
        p.initialize()
        context.subscriptions.push(vscode.window.registerTreeDataProvider(p.viewProviderId, p))
    })

    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(
        'lambda-node',
        new NodeDebugConfigurationProvider()
    ))

    await ext.statusBar.updateContext(undefined)
}

async function validateDebuggerIsInstalled(language: string): Promise<void> {
    if (!canDebug(language)) {
        // Do not await. The Thenable only resolves when the notification is closed.
        vscode.window.showWarningMessage(
            `No debugger is available for '${language}'. ` +
            `Please install an extension that provides a debugger for '${language}'`
        )
        await promptToInstallDebugger(language)
    }
}

async function promptToInstallDebugger(language: string): Promise<void> {
    // Do not await. The Thenable returned by executeCommand for quickOpen will not
    // resolve until the user presses Enter to accept the selected item.
    vscode.commands.executeCommand(
        'workbench.action.quickOpen',
        'ext install @ruby:<language> @category:debuggers @sort:installs'
    )
    // Even though there is only one option, acceptSelectedQuickOpenItem isn't smart
    // enough to select it by default.
    await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext')
    await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem')
}

function canDebug(language: string): boolean {
    return vscode.extensions.all
        .map(e => (e.packageJSON as NpmPackage).contributes.debuggers)
        .some(debuggers => !!debuggers && debuggers
            .some(d => !!d.languages && !!d.languages
                .some(l => l === language)
            )
        )
}

export function deactivate() {
}
