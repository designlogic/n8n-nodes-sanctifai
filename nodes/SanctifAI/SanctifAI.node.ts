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
				displayName: 'Task Type',
				name: 'taskTypeId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTaskTypes',
				},
				required: true,
				default: '',
				description: 'Type of task to execute',
			},
			{
				displayName: 'Message Content',
				name: 'content',
				type: 'string',
				required: true,
				default: '',
				description: 'Content to process with SanctifAI',
			},
		],
	};

	methods = {
		loadOptions: {
			async getTaskTypes(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('sanctifAIApi');
				
				const response = await this.helpers.request({
					method: 'GET',
					url: 'https://workflow.sanctifai.com/webhook/hgi/get-task-types',
					headers: {
						'Authorization': `Bearer ${credentials.bearerToken}`,
					},
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
		const credentials = await this.getCredentials('sanctifAIApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const content = this.getNodeParameter('content', i) as string;
				const taskTypeId = this.getNodeParameter('taskTypeId', i) as string;

				// Make POST request to create task
				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://workflow.sanctifai.com/webhook/hgi',
					headers: {
						'Authorization': `Bearer ${credentials.bearerToken}`,
					},
					body: {
						content,
						taskTypeId,
						callbackUrl: 'https://workflow.sanctifai.com/webhook-waiting/',
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