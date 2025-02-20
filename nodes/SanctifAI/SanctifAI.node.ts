import { INodeType, INodeTypeDescription, IExecuteFunctions, IDataObject, ILoadOptionsFunctions } from 'n8n-workflow';

export class SanctifAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SanctifAI',
		name: 'sanctifAI',
		icon: 'file:sanctifai.svg',
		group: ['transform'],
		version: 1,
		description: 'Send messages and manage workflows with SanctifAI',
		defaults: {
			name: 'SanctifAI',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message to SanctifAI',
						action: 'Send a message to SanctifAI',
					},
					{
						name: 'Get Task Types',
						value: 'getTaskTypes',
						description: 'Get list of available task types',
						action: 'Get list of available task types',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Message Content',
				name: 'content',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: '',
				description: 'Message content to send to SanctifAI',
			},
			{
				displayName: 'Task Type',
				name: 'taskTypeId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTaskTypes',
				},
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: '',
				description: 'Type of task to execute',
			},
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				default: 'https://workflow.sanctifai.com/webhook-waiting/',
				description: 'URL for the callback response',
			},
		],
	};

	methods = {
		loadOptions: {
			async getTaskTypes(this: ILoadOptionsFunctions) {
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://workflow.sanctifai.com/webhook/hgi/get-task-types',
					json: true,
				});

				return response.map((task: { id: string; name: string }) => ({
					name: task.name,
					value: task.id,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'sendMessage') {
					const content = this.getNodeParameter('content', i) as string;
					const taskTypeId = this.getNodeParameter('taskTypeId', i) as string;
					const callbackUrl = this.getNodeParameter('callbackUrl', i) as string;

					// Make POST request to send message
					const response = await this.helpers.request({
						method: 'POST',
						url: 'https://workflow.sanctifai.com/webhook/hgi',
						body: {
							content,
							callbackUrl,
							taskTypeId,
						},
						json: true,
					});

					returnData.push(response as IDataObject);
				}

				if (operation === 'getTaskTypes') {
					// Make GET request to fetch task types
					const taskTypes = await this.helpers.request({
						method: 'GET',
						url: 'https://workflow.sanctifai.com/webhook/hgi/get-task-types',
						json: true,
					});

					// Format the response to be more readable
					const formattedTaskTypes = taskTypes.map((task: { id: string; name: string }) => ({
						id: task.id,
						name: task.name,
					}));

					returnData.push({ taskTypes: formattedTaskTypes });
				}
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