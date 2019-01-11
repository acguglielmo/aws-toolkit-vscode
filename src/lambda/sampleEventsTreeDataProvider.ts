/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

import * as vscode from 'vscode'
import { AwsContextTreeCollection } from '../shared/awsContextTreeCollection'
import { AWSTreeNodeBase } from '../shared/treeview/awsTreeNodeBase'
import { RefreshableAwsTreeProvider } from '../shared/treeview/awsTreeProvider'
import { PlaceholderNode } from '../shared/treeview/placeholderNode'

export class SampleEventsTreeDataProvider
    implements vscode.TreeDataProvider<AWSTreeNodeBase>, RefreshableAwsTreeProvider {

    public viewProviderId: string = 'sampleEvents'
    public readonly onDidChangeTreeData: vscode.Event<AWSTreeNodeBase | undefined>
    private readonly _onDidChangeTreeData: vscode.EventEmitter<AWSTreeNodeBase | undefined>

    public constructor(
        private readonly awsContextTrees: AwsContextTreeCollection) {
        this._onDidChangeTreeData = new vscode.EventEmitter<AWSTreeNodeBase | undefined>()
        this.onDidChangeTreeData = this._onDidChangeTreeData.event
    }

    public initialize(): void {

        this.awsContextTrees.addTree(this)
    }

    public getTreeItem(element: AWSTreeNodeBase): vscode.TreeItem {
        return element
    }

    public async getChildren(element?: AWSTreeNodeBase): Promise<AWSTreeNodeBase[]> {
        return Promise.resolve([
            new PlaceholderNode(this, 'Curated Events'),
            new PlaceholderNode(this, 'Custom Events'),
        ])
    }

    public refresh(node?: AWSTreeNodeBase) {
        this._onDidChangeTreeData.fire(node)
    }
}
