/*
Copyright (C) 2019  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// @flow

import React from 'react'
import { observer } from 'mobx-react'
import styled from 'styled-components'

import providerStore, { getFieldChangeOptions } from '../../../stores/ProviderStore'
import replicaStore from '../../../stores/ReplicaStore'
import migrationStore from '../../../stores/MigrationStore'
import endpointStore from '../../../stores/EndpointStore'

import Button from '../../atoms/Button'
import StatusImage from '../../atoms/StatusImage'
import Modal from '../../molecules/Modal'
import Panel from '../../molecules/Panel'
import { isOptionsPageValid } from '../../organisms/WizardPageContent'
import WizardNetworks from '../../organisms/WizardNetworks'
import WizardOptions from '../../organisms/WizardOptions'
import WizardStorage from '../WizardStorage/WizardStorage'

import type { MainItem, UpdateData } from '../../../types/MainItem'
import type { NavigationItem } from '../../molecules/Panel'
import type { Endpoint, StorageBackend, StorageMap } from '../../../types/Endpoint'
import type { Field } from '../../../types/Field'
import type { Instance, Nic, Disk } from '../../../types/Instance'
import type { Network, NetworkMap } from '../../../types/Network'

import { providerTypes } from '../../../constants'
import configLoader from '../../../utils/Config'
import StyleProps from '../../styleUtils/StyleProps'

const PanelContent = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  min-height: 0;
`
const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32px 0;
`
const LoadingText = styled.div`
  font-size: 18px;
  margin-top: 32px;
`
const Buttons = styled.div`
  margin-top: 32px;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
`

type Props = {
  type?: 'replica' | 'migration',
  isOpen: boolean,
  onRequestClose: () => void,
  onUpdateComplete: (redirectTo: string) => void,
  replica: MainItem,
  destinationEndpoint: Endpoint,
  sourceEndpoint: Endpoint,
  instancesDetails: Instance[],
  instancesDetailsLoading: boolean,
  networks: Network[],
  networksLoading: boolean,
  onReloadClick: () => void,
}
type State = {
  selectedPanel: ?string,
  destinationData: any,
  sourceData: any,
  updateDisabled: boolean,
  selectedNetworks: NetworkMap[],
  storageMap: StorageMap[],
}

@observer
class EditReplica extends React.Component<Props, State> {
  state = {
    selectedPanel: null,
    destinationData: {},
    sourceData: {},
    updateDisabled: false,
    selectedNetworks: [],
    storageMap: [],
  }

  scrollableRef: HTMLElement

  componentWillMount() {
    this.loadData(true)

    this.setState({ selectedPanel: this.hasSourceOptions() ? 'source_options' : 'dest_options' })
  }

  loadData(useCache: boolean) {
    providerStore.loadProviders().then(() => {
      if (this.hasStorageMap()) {
        endpointStore.loadStorage(this.props.destinationEndpoint.id, {})
      }
      providerStore.loadDestinationSchema(this.props.destinationEndpoint.type, this.props.type || 'replica', useCache)
        .then(() => providerStore.getOptionsValues({
          optionsType: 'destination',
          endpointId: this.props.destinationEndpoint.id,
          provider: this.props.destinationEndpoint.type,
          useCache,
        })).then(() => {
          this.loadEnvDestinationOptions()
        })

      if (!this.hasSourceOptions()) {
        return
      }
      providerStore.loadSourceSchema(this.props.sourceEndpoint.type, this.props.type || 'replica', useCache)
        .then(() => providerStore.getOptionsValues({
          optionsType: 'source',
          endpointId: this.props.sourceEndpoint.id,
          provider: this.props.sourceEndpoint.type,
          useCache,
        }))
    })
  }

  hasStorageMap(): boolean {
    return providerStore.providers && providerStore.providers[this.props.destinationEndpoint.type] ?
      !!providerStore.providers[this.props.destinationEndpoint.type].types.find(t => t === providerTypes.STORAGE)
      : false
  }

  hasSourceOptions(): boolean {
    return Boolean(configLoader.config.sourceOptionsProviders.find(p => p === this.props.sourceEndpoint.type))
  }

  isUpdateDisabled() {
    let isLoadingDestOptions = this.state.selectedPanel === 'dest_options'
      && (providerStore.destinationSchemaLoading || providerStore.destinationOptionsLoading)
    let isLoadingSourceOptions = this.state.selectedPanel === 'source_options'
      && (providerStore.sourceSchemaLoading || providerStore.sourceOptionsLoading)
    let isLoadingNetwork = this.state.selectedPanel === 'network_mapping' && this.props.instancesDetailsLoading
    let isLoadingStorage = this.state.selectedPanel === 'storage_mapping'
      && (this.props.instancesDetailsLoading || endpointStore.storageLoading)
    return this.state.updateDisabled || isLoadingSourceOptions || isLoadingDestOptions || isLoadingNetwork || isLoadingStorage
  }

  parseReplicaData(environment: ?{ [string]: mixed }) {
    let data = {}
    let env = environment
    if (!env) {
      return data
    }
    Object.keys(env).forEach(key => {
      if (env[key] && typeof env[key] === 'object') {
        Object.keys(env[key]).forEach(subkey => {
          let destParent: any = env[key]
          if (destParent[subkey]) {
            data[`${key}/${subkey}`] = destParent[subkey]
          }
        })
      } else {
        data[key] = env[key]
      }
    })
    return data
  }

  loadEnvDestinationOptions(field?: Field) {
    let envData = getFieldChangeOptions({
      provider: this.props.destinationEndpoint.type,
      schema: providerStore.destinationSchema,
      data: {
        ...this.parseReplicaData(this.props.replica.destination_environment),
        ...this.state.destinationData,
      },
      field,
      type: 'destination',
    })

    if (envData) {
      providerStore.getOptionsValues({
        optionsType: 'destination',
        endpointId: this.props.destinationEndpoint.id,
        provider: this.props.destinationEndpoint.type,
        useCache: true,
        envData,
      })
    }
  }

  validateOptions(type: 'source' | 'destination') {
    let env = type === 'source' ? this.props.replica.source_environment : this.props.replica.destination_environment
    let data = type === 'source' ? this.state.sourceData : this.state.destinationData
    let schema = type === 'source' ? providerStore.sourceSchema : providerStore.destinationSchema
    let isValid = isOptionsPageValid({
      ...this.parseReplicaData(env),
      ...data,
    }, schema)

    this.setState({ updateDisabled: !isValid })
  }

  handlePanelChange(panel: string) {
    this.setState({ selectedPanel: panel })
  }

  handleReload() {
    this.props.onReloadClick()
    this.loadData(false)
  }

  handleFieldChange(type: 'source' | 'destination', field: Field, value: any) {
    let data = type === 'source' ? { ...this.state.sourceData } : { ...this.state.destinationData }
    if (field.type === 'array') {
      let oldValues: string[] = data[field.name] || []
      if (oldValues.find(v => v === value)) {
        data[field.name] = oldValues.filter(v => v !== value)
      } else {
        data[field.name] = [...oldValues, value]
      }
    } else {
      data[field.name] = value
    }

    if (type === 'source') {
      this.setState({ sourceData: data }, () => {
        this.validateOptions('source')
      })
    } else {
      this.setState({ destinationData: data }, () => {
        if (field.type !== 'string' || field.enum) {
          this.loadEnvDestinationOptions(field)
        }

        this.validateOptions('destination')
      })
    }
  }

  handleUpdateClick() {
    this.setState({ updateDisabled: true })

    let updateData: UpdateData = {
      source: this.state.sourceData,
      destination: this.state.destinationData,
      network: this.state.selectedNetworks.length > 0 ? this.getSelectedNetworks() : [],
      storage: this.state.storageMap,
    }
    if (this.props.type === 'replica') {
      let storageConfigDefault = this.getFieldValue('destination', 'default_storage') || endpointStore.storageConfigDefault
      replicaStore.update(this.props.replica, this.props.destinationEndpoint, updateData, storageConfigDefault).then(() => {
        this.props.onRequestClose()
        this.props.onUpdateComplete(`/replica/executions/${this.props.replica.id}`)
      }).catch(() => {
        this.setState({ updateDisabled: false })
      })
    } else {
      migrationStore.recreate(this.props.replica, this.props.sourceEndpoint, this.props.destinationEndpoint, updateData)
        .then((migration: MainItem) => {
          migrationStore.clearDetails()
          this.props.onRequestClose()
          this.props.onUpdateComplete(`/migration/tasks/${migration.id}`)
        }).catch(() => {
          this.setState({ updateDisabled: false })
        })
    }
  }

  handleNetworkChange(sourceNic: Nic, targetNetwork: Network) {
    let networkMap = this.state.selectedNetworks.filter(n => n.sourceNic.network_name !== sourceNic.network_name)
    this.setState({
      selectedNetworks: [...networkMap, { sourceNic, targetNetwork }],
    })
  }

  handleStorageChange(source: Disk, target: StorageBackend, type: 'backend' | 'disk') {
    let diskFieldName = type === 'backend' ? 'storage_backend_identifier' : 'id'
    let storageMap = this.state.storageMap
      .filter(n => n.type !== type || n.source[diskFieldName] !== source[diskFieldName])
    storageMap.push({ source, target, type })

    this.setState({ storageMap })
  }

  getFieldValue(type: 'source' | 'destination', fieldName: string, defaultValue: any) {
    let currentData = type === 'source' ? this.state.sourceData : this.state.destinationData
    if (currentData[fieldName] === undefined) {
      let replicaData = this.parseReplicaData(type === 'source' ? this.props.replica.source_environment
        : this.props.replica.destination_environment)
      if (replicaData[fieldName] !== undefined) {
        return replicaData[fieldName]
      }
      let osMapping = /^(windows|linux)_os_image$/.exec(fieldName)
      if (osMapping) {
        let osData = replicaData[`migr_image_map/${osMapping[1]}`]
        return osData
      }
      return defaultValue
    }
    return currentData[fieldName]
  }

  getSelectedNetworks(): NetworkMap[] {
    let selectedNetworks: NetworkMap[] = []
    let networkMap = this.props.replica.network_map

    if (networkMap) {
      Object.keys(networkMap).forEach(sourceNetworkName => {
        let network = this.props.networks.find(n => n.name === networkMap[sourceNetworkName] || n.id === networkMap[sourceNetworkName])
        if (!network) {
          return
        }
        selectedNetworks.push({
          sourceNic: { id: '', network_name: sourceNetworkName, mac_address: '', network_id: '' },
          targetNetwork: network,
        })
      })
    }
    selectedNetworks = selectedNetworks.map(mapping => {
      let updatedMapping = this.state.selectedNetworks.find(m => m.sourceNic.network_name === mapping.sourceNic.network_name)
      return updatedMapping || mapping
    })
    return selectedNetworks
  }

  getStorageMap(): StorageMap[] {
    let storageMap: StorageMap[] = []
    let currentStorage = this.props.replica.storage_mappings || {}
    let buildStorageMap = (type: 'backend' | 'disk', mapping: any) => {
      return {
        type,
        source: { storage_backend_identifier: mapping.source, id: mapping.disk_id },
        target: { name: mapping.destination, id: mapping.destination },
      }
    }
    let backendMappings = currentStorage.backend_mappings || []
    backendMappings.forEach(mapping => {
      storageMap.push(buildStorageMap('backend', mapping))
    })

    let diskMappings = currentStorage.disk_mappings || []
    diskMappings.forEach(mapping => {
      storageMap.push(buildStorageMap('disk', mapping))
    })

    this.state.storageMap.forEach(mapping => {
      let fieldName = mapping.type === 'backend' ? 'storage_backend_identifier' : 'id'
      let existingMapping = storageMap.find(m => m.type === mapping.type &&
        m.source[fieldName] === String(mapping.source[fieldName])
      )
      if (existingMapping) {
        existingMapping.target = mapping.target
      } else {
        storageMap.push(mapping)
      }
    })

    return storageMap
  }

  renderOptions(type: 'source' | 'destination') {
    let loading = type === 'source' ? (providerStore.sourceSchemaLoading || providerStore.sourceOptionsLoading) :
      providerStore.destinationSchemaLoading || providerStore.destinationOptionsLoading
    if (loading) {
      return this.renderLoading(`Loading ${type === 'source' ? 'source' : 'target'} options ...`)
    }
    let schema = type === 'source' ? providerStore.sourceSchema : providerStore.destinationSchema
    let fields = this.props.type === 'replica' ? schema.filter(f => !f.readOnly) : schema

    return (
      <WizardOptions
        wizardType={`replica-${type}-options-edit`}
        getFieldValue={(f, d) => this.getFieldValue(type, f, d)}
        fields={fields}
        hasStorageMap={type === 'source' ? false : this.hasStorageMap()}
        storageBackends={endpointStore.storageBackends}
        storageConfigDefault={endpointStore.storageConfigDefault}
        onChange={(f, v) => { this.handleFieldChange(type, f, v) }}
        oneColumnStyle={{ marginTop: '-16px', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}
        columnStyle={{ marginRight: 0 }}
        fieldWidth={StyleProps.inputSizes.large.width}
        onScrollableRef={ref => { this.scrollableRef = ref }}
        availableHeight={384}
        useAdvancedOptions
      />
    )
  }

  renderStorageMapping() {
    if (this.props.instancesDetailsLoading) {
      return this.renderLoading('Loading instances details ...')
    }
    if (endpointStore.storageLoading) {
      return this.renderLoading('Loading storage ...')
    }

    return (
      <WizardStorage
        storageBackends={endpointStore.storageBackends}
        instancesDetails={this.props.instancesDetails}
        storageMap={this.getStorageMap()}
        onChange={(s, t, type) => { this.handleStorageChange(s, t, type) }}
      />
    )
  }

  renderNetworkMapping() {
    return (
      <WizardNetworks
        instancesDetails={this.props.instancesDetails}
        loadingInstancesDetails={this.props.instancesDetailsLoading}
        networks={this.props.networks}
        loading={this.props.networksLoading}
        onChange={(nic, network) => { this.handleNetworkChange(nic, network) }}
        selectedNetworks={this.getSelectedNetworks()}
      />
    )
  }

  renderContent() {
    let content = null
    switch (this.state.selectedPanel) {
      case 'source_options':
        content = this.renderOptions('source')
        break
      case 'dest_options':
        content = this.renderOptions('destination')
        break
      case 'network_mapping':
        content = this.renderNetworkMapping()
        break
      case 'storage_mapping':
        content = this.renderStorageMapping()
        break
      default:
        content = null
    }
    return (
      <PanelContent>
        {content}
        <Buttons>
          <Button
            large
            onClick={this.props.onRequestClose}
            secondary
          >Cancel</Button>
          <Button
            large
            onClick={() => { this.handleUpdateClick() }}
            disabled={this.isUpdateDisabled()}
          >
            {this.props.type === 'replica' ? 'Update' : 'Create'}
          </Button>
        </Buttons>
      </PanelContent>
    )
  }

  renderLoading(message: string) {
    let loadingMessage = message || 'Loading ...'

    return (
      <LoadingWrapper>
        <StatusImage loading />
        <LoadingText>{loadingMessage}</LoadingText>
      </LoadingWrapper>
    )
  }

  render() {
    let navigationItems: NavigationItem[] = [
      { value: 'dest_options', label: 'Target Options' },
      { value: 'network_mapping', label: 'Network Mapping' },
    ]

    if (this.hasStorageMap()) {
      navigationItems.push({ value: 'storage_mapping', label: 'Storage Mapping' })
    }

    if (this.hasSourceOptions()) {
      navigationItems.splice(0, 0, { value: 'source_options', label: 'Source Options' })
    }

    return (
      <Modal
        isOpen={this.props.isOpen}
        title={`${this.props.type === 'replica' ? 'Edit Replica' : 'Recreate Migration'}`}
        onRequestClose={this.props.onRequestClose}
        contentStyle={{ width: '800px' }}
        onScrollableRef={() => this.scrollableRef}
        fixedHeight={512}
      >
        <Panel
          navigationItems={navigationItems}
          content={this.renderContent()}
          onChange={navItem => { this.handlePanelChange(navItem.value) }}
          selectedValue={this.state.selectedPanel}
          onReloadClick={() => { this.handleReload() }}
        />
      </Modal>
    )
  }
}

export default EditReplica
