import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SanctifAIApi implements ICredentialType {
	name = 'sanctifAIApi';
	displayName = 'SanctifAI API';
	documentationUrl = 'https://github.com/designlogic/n8n-nodes-sanctifai';
	properties: INodeProperties[] = [
		{
			displayName: 'Bearer Token',
			name: 'bearerToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
} 