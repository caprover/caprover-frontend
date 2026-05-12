import { IAppEnvVar } from '../containers/apps/AppDefinition'

interface ProjectDefinition {
    id: string
    name: string
    description: string
    parentProjectId?: string
    envVars?: IAppEnvVar[]
}

export default ProjectDefinition
