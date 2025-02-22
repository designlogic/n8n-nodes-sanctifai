import { INodeType, INodeTypeDescription, IExecuteFunctions, IDataObject, ILoadOptionsFunctions } from 'n8n-workflow';

export class SanctifAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SanctifAI',
		name: 'sanctifAI',
		icon: 'file:sanctifai.svg',
		group: ['transform'],
		version: 1,
		description: 'Create tasks in SanctifAI',
		defaults: {
			name: 'SanctifAI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sanctifAIApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Task Template Name or ID',
				name: 'taskTypeId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTaskTemplates',
				},
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},
			{
				displayName: 'Message Content',
				name: 'content',
				type: 'string',
				required: true,
				default: '',
				description: 'Content to process with SanctifAI',
			},
			{
				displayName: 'Override Callback URL',
				name: 'overrideCallbackUrl',
				type: 'boolean',
				default: false,
				description: 'Whether to override the default callback URL',
			},
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						overrideCallbackUrl: [true],
					},
				},
				default: 'https://workflow.sanctifai.com/webhook-waiting/',
				description: 'URL to receive the task result',
			},
		],
	};

	methods = {
		loadOptions: {
			async getTaskTemplates(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('sanctifAIApi');

				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://workflow.sanctifai.com/webhook/hgi/get-task-templates',
					headers: {
						'Authorization': `Bearer ${credentials.bearerToken}`,
					},
					json: true,
				});

				return response.map((task: { id: string; name: string; description: string; api: string }) => ({
					name: `${task.name} - ${task.description}`,
					value: task.id,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const credentials = await this.getCredentials('sanctifAIApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const content = this.getNodeParameter('content', i) as string;
				const taskTypeId = this.getNodeParameter('taskTypeId', i) as string;
				const overrideCallbackUrl = this.getNodeParameter('overrideCallbackUrl', i) as boolean;
				const callbackUrl = overrideCallbackUrl
					? this.getNodeParameter('callbackUrl', i) as string
					: 'https://workflow.sanctifai.com/webhook-waiting/';

				// Make POST request to create task
				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://workflow.sanctifai.com/webhook/hgi/auto-fixing-haat',
					headers: {
						'Authorization': `Bearer ${credentials.bearerToken}`,
					},
					body: {
						content,
						taskTypeId,
						callbackUrl,
					},
					json: true,
				});

				returnData.push(response as IDataObject);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
