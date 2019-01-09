/*!
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

import _ = require('lodash')
import * as vscode from 'vscode'
import { BaseTemplates } from '../../shared/templates/baseTemplates'
import { ErrorNode } from '../explorer/errorNode'
import { ErrorTemplates } from '../templates/errorTemplates'

export async function showStackTrace(element: ErrorNode) {
    try {

        const view = vscode.window.createWebviewPanel(
            'html',
            `Getting stack trace for ${element.parent.label}`,
            -1
        )

        const baseTemplateFn = _.template(BaseTemplates.SIMPLE_HTML)
        view.webview.html = baseTemplateFn({ content: '<h1>Loading...</h1>' })

        const getConfigTemplateFn = _.template(ErrorTemplates.SHOW_STACK_TRACE)
        view.webview.html = baseTemplateFn({
            content: getConfigTemplateFn(element)
        })
    } catch (err) {
        const error = err as Error
        console.log(error.message)
    }
}